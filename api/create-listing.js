/**
 * Vercel Serverless Function - Create Marketplace Listing
 * 
 * Webhook URL: https://garage-sale-40afc1f5.vercel.app/api/create-listing
 * Method: POST
 * 
 * Request Body:
 * {
 *   "title": "Item Title",
 *   "description": "Item description",
 *   "price": 99.99,
 *   "category": "electronics",  // electronics, clothing, furniture, books, toys, sports, home_garden, automotive, collectibles, other
 *   "condition": "like_new",    // new, like_new, good, fair, poor
 *   "seller_id": "uuid-of-seller",  // Optional, defaults to system user
 *   "images": [                 // Array of image URLs or base64 data
 *     "https://example.com/image1.jpg",
 *     "data:image/jpeg;base64,/9j/4AAQ...",
 *     "https://example.com/image2.jpg"
 *   ],
 *   "tags": ["tag1", "tag2"],   // Optional
 *   "location": "City, State"   // Optional
 * }
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Server-side key with full access
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Use service key if available, otherwise anon key
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper to upload image from URL or base64
async function uploadImage(imageData, index) {
  try {
    let blob;
    let fileExt = 'jpg';

    // Check if it's a URL or base64
    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      // Download from URL
      const response = await fetch(imageData);
      blob = await response.blob();
      
      // Try to get extension from URL
      const urlExt = imageData.split('.').pop().split('?')[0].toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(urlExt)) {
        fileExt = urlExt;
      }
    } else if (imageData.startsWith('data:image/')) {
      // Handle base64
      const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (matches) {
        fileExt = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        blob = new Blob([buffer]);
      }
    } else {
      throw new Error('Invalid image format. Must be URL or base64 data URI');
    }

    if (!blob) {
      throw new Error('Failed to process image');
    }

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${index}.${fileExt}`;
    const filePath = `listings/${fileName}`;

    const { data, error } = await supabase.storage
      .from('item_images')
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('item_images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    return null;
  }
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const {
      title,
      description,
      price,
      category = 'other',
      condition = 'good',
      seller_id,
      images = [],
      tags = [],
      location
    } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title and description are required'
      });
    }

    if (price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        error: 'Price is required'
      });
    }

    // Validate category
    const validCategories = [
      'electronics', 'clothing', 'furniture', 'books', 'toys', 
      'sports', 'home_garden', 'automotive', 'collectibles', 'other'
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    // Validate condition
    const validConditions = ['new', 'like_new', 'good', 'fair', 'poor'];
    if (!validConditions.includes(condition)) {
      return res.status(400).json({
        success: false,
        error: `Invalid condition. Must be one of: ${validConditions.join(', ')}`
      });
    }

    console.log(`Processing new listing: ${title}`);
    console.log(`Images to process: ${images.length}`);

    // Upload images
    const uploadedImageUrls = [];
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        console.log(`Uploading image ${i + 1}/${images.length}`);
        const imageUrl = await uploadImage(images[i], i);
        if (imageUrl) {
          uploadedImageUrls.push(imageUrl);
        }
      }
    }

    console.log(`Successfully uploaded ${uploadedImageUrls.length} images`);

    // Create the listing in the database
    const itemData = {
      title,
      description,
      price: parseFloat(price),
      category,
      condition,
      seller_id: seller_id || null, // Use provided seller_id or null for system listings
      image_urls: uploadedImageUrls,
      tags: tags || [],
      location: location || null,
      status: 'active',
      created_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: item, error: insertError } = await supabase
      .from('items')
      .insert(itemData)
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return res.status(500).json({
        success: false,
        error: `Failed to create listing: ${insertError.message}`,
        details: insertError
      });
    }

    console.log(`Successfully created listing with ID: ${item.id}`);

    return res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      item: item,
      uploaded_images: uploadedImageUrls.length
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: error.toString()
    });
  }
}

