'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface DealerActionResponse {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Helper to authenticate user and resolve Dealer ID
 */
async function getAuthenticatedDealerId() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized user session.');
  }

  const role = user.app_metadata?.role;
  const status = user.app_metadata?.status;
  if (role !== 'DEALER') {
    throw new Error('Access denied. Dealer portal only.');
  }
  if (status !== 'Approved') {
    throw new Error('Access denied. Dealer profile is pending approval or inactive.');
  }

  const adminSupabase = createAdminClient();
  const { data: dealer, error: dbError } = await adminSupabase
    .from('dealers')
    .select('dealer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (dbError || !dealer) {
    throw new Error('Dealer profile not found.');
  }

  return { dealerId: dealer.dealer_id, userId: user.id };
}

/**
 * Creates a new dealer listing property atomically
 */
export async function createDealerProperty(formData: {
  title: string;
  propertyType: string;
  price: number;
  city: string;
  area: string;
  locality: string;
  areaSize: number;
  bhk: string;
  facing: string;
  description: string;
  amenities: string[];
  facilities: { facility_name: string; distance: number }[];
  mediaUrls: string[];
}): Promise<DealerActionResponse> {
  try {
    const { dealerId } = await getAuthenticatedDealerId();
    const adminSupabase = createAdminClient();

    // 1. Insert property main record
    const { data: prop, error: propError } = await adminSupabase
      .from('dealer_properties')
      .insert({
        dealer_id: dealerId,
        title: formData.title,
        property_type: formData.propertyType,
        price: formData.price,
        city: formData.city,
        area: formData.area,
        locality: formData.locality,
        area_size: formData.areaSize,
        bhk: formData.bhk,
        facing: formData.facing,
        status: 'Active',
      })
      .select('property_id')
      .single();

    if (propError || !prop) {
      return { success: false, error: propError?.message || 'Failed to list property.' };
    }

    const propertyId = prop.property_id;

    // 2. Insert Amenities if any
    if (formData.amenities && formData.amenities.length > 0) {
      const amenitiesData = formData.amenities.map(name => ({
        property_id: propertyId,
        amenity_name: name,
      }));
      const { error: amenError } = await adminSupabase
        .from('property_amenities')
        .insert(amenitiesData);
      if (amenError) {
        return { success: false, error: 'Property added but failed to save amenities.' };
      }
    }

    // 3. Insert Nearby Facilities if any
    if (formData.facilities && formData.facilities.length > 0) {
      const facilitiesData = formData.facilities.map(f => ({
        property_id: propertyId,
        facility_name: f.facility_name,
        distance: f.distance,
      }));
      const { error: facError } = await adminSupabase
        .from('property_facilities')
        .insert(facilitiesData);
      if (facError) {
        return { success: false, error: 'Property added but failed to save nearby facilities.' };
      }
    }

    // 4. Insert Media items if any
    if (formData.mediaUrls && formData.mediaUrls.length > 0) {
      const mediaData = formData.mediaUrls.map(url => ({
        property_id: propertyId,
        file_url: url,
        file_type: 'image/jpeg',
      }));
      const { error: medError } = await adminSupabase
        .from('property_media')
        .insert(mediaData);
      if (medError) {
        return { success: false, error: 'Property added but failed to save media attachments.' };
      }
    }

    return { success: true, data: propertyId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to list property.' };
  }
}

/**
 * Helper to check active visits or deals linked to a property
 */
async function checkActiveLinks(propertyId: string, adminSupabase: any) {
  // Query active visits
  const { data: visits, error: visitError } = await adminSupabase
    .from('visits')
    .select('visit_id')
    .eq('property_id', propertyId)
    .in('status', ['Requested', 'Under Review', 'Approved', 'Scheduled', 'Rescheduled', 'Postponed'])
    .is('deleted_at', null);

  if (visitError) throw visitError;
  if (visits && visits.length > 0) {
    throw new Error('Property protection lock: This property is linked to active scheduled visits and cannot be deleted or inactivated.');
  }

  // Query active deals
  const { data: deals, error: dealError } = await adminSupabase
    .from('deals')
    .select('deal_id')
    .eq('property_id', propertyId)
    .in('current_stage', ['Interested', 'Negotiation', 'Token Paid', 'Documentation', 'Registration'])
    .is('deleted_at', null);

  if (dealError) throw dealError;
  if (deals && deals.length > 0) {
    throw new Error('Property protection lock: This property is linked to active deals or negotiations and cannot be deleted or inactivated.');
  }
}

/**
 * Updates a dealer property status (gated by visits/deals locks)
 */
export async function updatePropertyStatus(
  propertyId: string,
  newStatus: 'Active' | 'Inactive' | 'Sold'
): Promise<DealerActionResponse> {
  try {
    const { dealerId } = await getAuthenticatedDealerId();
    const adminSupabase = createAdminClient();

    // Verify property ownership
    const { data: prop } = await adminSupabase
      .from('dealer_properties')
      .select('property_id')
      .eq('property_id', propertyId)
      .eq('dealer_id', dealerId)
      .maybeSingle();

    if (!prop) {
      return { success: false, error: 'Property listing not found or unauthorized.' };
    }

    // Gated check: cannot inactivate/sold if linked to active visit/deal
    if (newStatus === 'Inactive' || newStatus === 'Sold') {
      try {
        await checkActiveLinks(propertyId, adminSupabase);
      } catch (checkErr: any) {
        return { success: false, error: checkErr.message };
      }
    }

    const { error: updateError } = await adminSupabase
      .from('dealer_properties')
      .update({ status: newStatus })
      .eq('property_id', propertyId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update property status.' };
  }
}

/**
 * Soft deletes a dealer property listing (gated by visits/deals locks)
 */
export async function softDeleteProperty(propertyId: string): Promise<DealerActionResponse> {
  try {
    const { dealerId } = await getAuthenticatedDealerId();
    const adminSupabase = createAdminClient();

    // Verify property ownership
    const { data: prop } = await adminSupabase
      .from('dealer_properties')
      .select('property_id')
      .eq('property_id', propertyId)
      .eq('dealer_id', dealerId)
      .maybeSingle();

    if (!prop) {
      return { success: false, error: 'Property listing not found or unauthorized.' };
    }

    // Gated check: cannot delete if linked to active visit/deal
    try {
      await checkActiveLinks(propertyId, adminSupabase);
    } catch (checkErr: any) {
      return { success: false, error: checkErr.message };
    }

    const { error: deleteError } = await adminSupabase
      .from('dealer_properties')
      .update({ deleted_at: new Date().toISOString() })
      .eq('property_id', propertyId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete property listing.' };
  }
}

/**
 * Adds a new geographic service area to the dealer coverage directory
 */
export async function addCoverageArea(formData: {
  state: string;
  city: string;
  area: string;
}): Promise<DealerActionResponse> {
  try {
    const { dealerId } = await getAuthenticatedDealerId();
    const adminSupabase = createAdminClient();

    // Insert coverage area
    const { data: area, error } = await adminSupabase
      .from('dealer_coverage_areas')
      .insert({
        dealer_id: dealerId,
        state: formData.state,
        city: formData.city,
        area: formData.area,
      })
      .select('coverage_id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: area.coverage_id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add coverage area.' };
  }
}

/**
 * Removes a geographic service area
 */
export async function deleteCoverageArea(coverageId: string): Promise<DealerActionResponse> {
  try {
    const { dealerId } = await getAuthenticatedDealerId();
    const adminSupabase = createAdminClient();

    // Verify ownership and delete
    const { error } = await adminSupabase
      .from('dealer_coverage_areas')
      .delete()
      .eq('coverage_id', coverageId)
      .eq('dealer_id', dealerId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete coverage area.' };
  }
}

/**
 * Updates a deal stage (gated by dealer authority lifecycle rules)
 */
export async function updateDealStage(
  dealId: string,
  targetStage: string
): Promise<DealerActionResponse> {
  try {
    const { dealerId } = await getAuthenticatedDealerId();
    const adminSupabase = createAdminClient();

    // Verify that the deal belongs to one of this dealer's properties
    const { data: deal } = await adminSupabase
      .from('deals')
      .select(`
        deal_id,
        current_stage,
        property_id,
        dealer_properties (
          dealer_id
        )
      `)
      .eq('deal_id', dealId)
      .is('deleted_at', null)
      .maybeSingle();

    if (!deal || (deal.dealer_properties as any)?.dealer_id !== dealerId) {
      return { success: false, error: 'Deal not found or unauthorized.' };
    }

    // Enforce Deal Lifecycle authority:
    // Dealer may ONLY transition to: 'Interested', 'Negotiation', 'Closed Lost'
    const allowedDealerStages = ['Interested', 'Negotiation', 'Closed Lost'];
    if (!allowedDealerStages.includes(targetStage)) {
      return {
        success: false,
        error: `Lifecycle Restriction: Dealers are not authorized to transition deals to '${targetStage}'. Employee or Admin validation is required.`,
      };
    }

    const { error: updateError } = await adminSupabase
      .from('deals')
      .update({ current_stage: targetStage })
      .eq('deal_id', dealId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update deal stage.' };
  }
}
