import { supabase } from '../lib/supabase';
import { Item, Transaction, Rating, User } from './entities';
import { GenerateItemDescription } from './integrations';

// Process item submission with AI enhancement
export const processItemSubmission = async (itemData) => {
  try {
    // If images are provided, analyze them with AI
    if (itemData.image_urls && itemData.image_urls.length > 0) {
      const { ExtractDataFromUploadedFile } = await import('./integrations');
      const aiData = await ExtractDataFromUploadedFile({ file_url: itemData.image_urls[0] });
      
      // Merge AI suggestions with user data
      itemData = {
        ...itemData,
        category: itemData.category || aiData.category,
        condition: itemData.condition || aiData.condition,
        description: itemData.description || aiData.description
      };
    }

    // Generate enhanced description if needed
    if (itemData.title) {
      const enhanced = await GenerateItemDescription(itemData);
      itemData.description = enhanced.description || itemData.description;
      itemData.tags = [...(itemData.tags || []), ...(enhanced.tags || [])];
    }

    // Create the item
    const item = await Item.create(itemData);
    return item;
  } catch (error) {
    console.error('Error processing item submission:', error);
    throw error;
  }
};

// Get user's items
export const getUserItems = async (userId) => {
  try {
    const items = await Item.filter({ seller_id: userId }, '-created_date');
    return items;
  } catch (error) {
    console.error('Error getting user items:', error);
    throw error;
  }
};

// Update item status
export const updateItemStatus = async (itemId, status) => {
  try {
    const item = await Item.update(itemId, { status });
    return item;
  } catch (error) {
    console.error('Error updating item status:', error);
    throw error;
  }
};

// Create Stripe checkout session
export const createStripeSession = async ({ itemId, buyerInfo }) => {
  try {
    const item = await Item.get(itemId);
    if (!item) throw new Error('Item not found');
    if (item.status !== 'active') throw new Error('Item is not available');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create transaction record
    const transaction = await Transaction.create({
      item_id: itemId,
      buyer_id: user.id,
      seller_id: item.seller_id,
      amount: item.price,
      status: 'pending',
      buyer_contact_info: buyerInfo
    });

    // In a real app, this would call a Supabase Edge Function to create a Stripe session
    // For now, we'll return mock data
    const sessionUrl = `${import.meta.env.VITE_APP_URL}/success?session_id=${transaction.id}`;
    
    return {
      session_id: transaction.id,
      url: sessionUrl
    };
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    throw error;
  }
};

// Create donation session
export const createDonationSession = async ({ amount, businessId }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // In a real app, this would call a Supabase Edge Function
    const sessionUrl = `${import.meta.env.VITE_APP_URL}/success`;
    
    return {
      url: sessionUrl
    };
  } catch (error) {
    console.error('Error creating donation session:', error);
    throw error;
  }
};

// Create rating
export const createRating = async ({ transactionId, ratedUserId, rating, review, role }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const ratingRecord = await Rating.create({
      transaction_id: transactionId,
      rated_user_id: ratedUserId,
      rated_by_user_id: user.id,
      rating,
      review,
      role
    });

    return ratingRecord;
  } catch (error) {
    console.error('Error creating rating:', error);
    throw error;
  }
};

// Stripe webhook handler (would be implemented as Edge Function)
export const stripeWebhook = async (event) => {
  // This would be handled by a Supabase Edge Function
  console.log('Stripe webhook event:', event);
  return { received: true };
};

// Create connected account for businesses
export const createConnectedAccount = async ({ businessId }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // This would call a Supabase Edge Function to create Stripe Connected Account
    return {
      account_id: `acct_${Date.now()}`,
      success: true
    };
  } catch (error) {
    console.error('Error creating connected account:', error);
    throw error;
  }
};

// Create account link
export const createAccountLink = async ({ accountId }) => {
  try {
    // This would call a Supabase Edge Function
    return {
      url: `${import.meta.env.VITE_APP_URL}/business-onboarding`
    };
  } catch (error) {
    console.error('Error creating account link:', error);
    throw error;
  }
};

// Get account status
export const getAccountStatus = async ({ accountId }) => {
  try {
    // This would call a Supabase Edge Function
    return {
      charges_enabled: true,
      details_submitted: true
    };
  } catch (error) {
    console.error('Error getting account status:', error);
    throw error;
  }
};

// Create Stripe product (for businesses)
export const createStripeProduct = async ({ productData }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // This would call a Supabase Edge Function
    return {
      product_id: `prod_${Date.now()}`,
      price_id: `price_${Date.now()}`
    };
  } catch (error) {
    console.error('Error creating Stripe product:', error);
    throw error;
  }
};

// Create checkout session for business products
export const createStripeCheckoutSession = async ({ priceId, quantity = 1 }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // This would call a Supabase Edge Function
    return {
      url: `${import.meta.env.VITE_APP_URL}/success`
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Ingest listing (AI-powered listing creation)
export const ingestListing = async ({ imageUrls, initialData = {} }) => {
  try {
    const { ExtractDataFromUploadedFile } = await import('./integrations');
    
    // Analyze the first image
    let aiData = {};
    if (imageUrls && imageUrls.length > 0) {
      aiData = await ExtractDataFromUploadedFile({ file_url: imageUrls[0] });
    }

    // Combine with initial data
    const itemData = {
      ...aiData,
      ...initialData,
      image_urls: imageUrls
    };

    // Generate enhanced description
    const enhanced = await GenerateItemDescription(itemData);

    return {
      ...itemData,
      title: enhanced.title || itemData.title,
      description: enhanced.description || itemData.description,
      tags: enhanced.tags || itemData.tags
    };
  } catch (error) {
    console.error('Error ingesting listing:', error);
    throw error;
  }
};
