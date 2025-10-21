# Webhook API Documentation - Create Listing

## Overview

This webhook allows you to automatically create marketplace listings by sending a POST request with item details and images.

---

## Webhook URL

```
https://garage-sale-40afc1f5.vercel.app/api/create-listing
```

**Method:** `POST`  
**Content-Type:** `application/json`

---

## Request Body Schema

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "price": "number (required)",
  "category": "string (optional, default: 'other')",
  "condition": "string (optional, default: 'good')",
  "seller_id": "string (optional, default: null)",
  "images": ["array of strings (optional)"],
  "tags": ["array of strings (optional)"],
  "location": "string (optional)"
}
```

### Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | **Yes** | Item title (max 255 characters) |
| `description` | string | **Yes** | Item description |
| `price` | number | **Yes** | Item price (use 0 for free items) |
| `category` | string | No | One of: `electronics`, `clothing`, `furniture`, `books`, `toys`, `sports`, `home_garden`, `automotive`, `collectibles`, `other` |
| `condition` | string | No | One of: `new`, `like_new`, `good`, `fair`, `poor` |
| `seller_id` | string | No | Supabase user UUID. If not provided, item will be a system listing |
| `images` | array | No | Array of image URLs or base64 data URIs |
| `tags` | array | No | Array of tag strings for search/categorization |
| `location` | string | No | Geographic location (e.g., "San Francisco, CA") |

---

## Image Formats Supported

The `images` array can contain:

1. **HTTP/HTTPS URLs:**
   ```json
   "images": [
     "https://example.com/image1.jpg",
     "https://example.com/image2.png"
   ]
   ```

2. **Base64 Data URIs:**
   ```json
   "images": [
     "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
     "data:image/png;base64,iVBORw0KGgoAAAANSUhEU..."
   ]
   ```

3. **Mixed:**
   ```json
   "images": [
     "https://example.com/image1.jpg",
     "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
   ]
   ```

**Supported formats:** JPG, JPEG, PNG, GIF, WEBP

---

## Example Requests

### Example 1: Basic Listing with Image URLs

```bash
curl -X POST https://garage-sale-40afc1f5.vercel.app/api/create-listing \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Vintage Leather Chair",
    "description": "Beautiful vintage leather chair in excellent condition. Perfect for home office or reading nook.",
    "price": 150,
    "category": "furniture",
    "condition": "like_new",
    "images": [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800"
    ],
    "tags": ["vintage", "leather", "chair", "furniture"],
    "location": "San Francisco, CA"
  }'
```

### Example 2: Free Item

```bash
curl -X POST https://garage-sale-40afc1f5.vercel.app/api/create-listing \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Free Textbooks",
    "description": "College textbooks, free to a good home",
    "price": 0,
    "category": "books",
    "condition": "good",
    "images": ["https://example.com/books.jpg"]
  }'
```

### Example 3: JavaScript/Node.js

```javascript
const response = await fetch('https://garage-sale-40afc1f5.vercel.app/api/create-listing', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Smartwatch X200',
    description: 'Latest model smartwatch with GPS and heart rate monitor',
    price: 299.99,
    category: 'electronics',
    condition: 'new',
    images: [
      'https://example.com/smartwatch-1.jpg',
      'https://example.com/smartwatch-2.jpg'
    ],
    tags: ['smartwatch', 'fitness', 'tech'],
    seller_id: 'your-user-uuid-here'
  })
});

const result = await response.json();
console.log(result);
```

### Example 4: Python

```python
import requests
import json

url = 'https://garage-sale-40afc1f5.vercel.app/api/create-listing'

data = {
    'title': 'Mountain Bike',
    'description': 'Trek mountain bike, 21-speed, great condition',
    'price': 450,
    'category': 'sports',
    'condition': 'good',
    'images': [
        'https://example.com/bike-1.jpg',
        'https://example.com/bike-2.jpg'
    ],
    'tags': ['bike', 'mountain bike', 'trek', 'outdoor'],
    'location': 'Portland, OR'
}

response = requests.post(url, json=data)
print(response.json())
```

---

## Response Format

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Listing created successfully",
  "item": {
    "id": "uuid-of-created-item",
    "title": "Vintage Leather Chair",
    "description": "Beautiful vintage leather chair...",
    "price": 150,
    "category": "furniture",
    "condition": "like_new",
    "seller_id": null,
    "image_urls": [
      "https://biwuxtvgvkkltrdpuptl.supabase.co/storage/v1/object/public/item_images/listings/1234567890-0.jpg",
      "https://biwuxtvgvkkltrdpuptl.supabase.co/storage/v1/object/public/item_images/listings/1234567890-1.jpg"
    ],
    "tags": ["vintage", "leather", "chair", "furniture"],
    "location": "San Francisco, CA",
    "status": "active",
    "created_date": "2025-10-21T10:30:00.000Z",
    "updated_at": "2025-10-21T10:30:00.000Z"
  },
  "uploaded_images": 2
}
```

### Error Responses

#### 400 Bad Request - Missing Required Fields
```json
{
  "success": false,
  "error": "Missing required fields: title and description are required"
}
```

#### 400 Bad Request - Invalid Category
```json
{
  "success": false,
  "error": "Invalid category. Must be one of: electronics, clothing, furniture, books, toys, sports, home_garden, automotive, collectibles, other"
}
```

#### 405 Method Not Allowed
```json
{
  "success": false,
  "error": "Method not allowed. Use POST."
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to create listing: [error details]"
}
```

---

## Testing the Webhook

### Test with cURL (No Images)
```bash
curl -X POST https://garage-sale-40afc1f5.vercel.app/api/create-listing \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Item",
    "description": "This is a test listing",
    "price": 10,
    "category": "other",
    "condition": "good"
  }'
```

### Test with cURL (With Images)
```bash
curl -X POST https://garage-sale-40afc1f5.vercel.app/api/create-listing \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Item with Images",
    "description": "Testing image upload",
    "price": 25,
    "images": [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
    ]
  }'
```

---

## Rate Limiting & Best Practices

1. **Image Size:** Keep images under 5MB each
2. **Image Count:** Maximum 10 images per listing (recommended)
3. **Rate Limiting:** Consider implementing rate limiting on your side
4. **Error Handling:** Always check the `success` field in responses
5. **Retries:** Implement exponential backoff for failed requests
6. **Timeout:** Set a reasonable timeout (30-60 seconds for large images)

---

## Security Notes

- This endpoint is currently **public** (no authentication required)
- Consider adding API key authentication for production use
- Validate and sanitize all input on your side before sending
- Monitor for abuse and implement rate limiting

---

## Environment Variables Required

To use this webhook, ensure these environment variables are set in Vercel:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key (for server-side operations)

---

## Support & Troubleshooting

### Common Issues

1. **Images not uploading:**
   - Check image URL is publicly accessible
   - Verify base64 data is properly formatted
   - Ensure images are in supported formats

2. **"Failed to create listing" error:**
   - Check Supabase connection
   - Verify database schema matches expected fields
   - Check RLS policies on items table

3. **Timeout errors:**
   - Reduce image sizes
   - Process fewer images per request
   - Check network connectivity

### Logs

Check Vercel function logs for detailed error information:
https://vercel.com/doubleclicks/garage-sale-40afc1f5/logs

---

## Changelog

### v1.0.0 (2025-10-21)
- Initial webhook implementation
- Support for image URLs and base64 data
- Multiple image upload support
- Full validation and error handling

