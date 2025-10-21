import { supabase } from '../lib/supabase';
import { generateItemDescription, analyzeItemImage } from '../lib/openai';

// File upload to Supabase Storage
export const UploadFile = async ({ file }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('items')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('items')
      .getPublicUrl(data.path);

    return { file_url: publicUrl };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Upload private file
export const UploadPrivateFile = async ({ file, bucket = 'items' }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;

    return { file_path: data.path };
  } catch (error) {
    console.error('Error uploading private file:', error);
    throw error;
  }
};

// Create signed URL for private files
export const CreateFileSignedUrl = async ({ bucket, path, expiresIn = 3600 }) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;

    return { signed_url: data.signedUrl };
  } catch (error) {
    console.error('Error creating signed URL:', error);
    throw error;
  }
};

// Extract data from uploaded file using OpenAI
export const ExtractDataFromUploadedFile = async ({ file_url }) => {
  try {
    const result = await analyzeItemImage(file_url);
    return result;
  } catch (error) {
    console.error('Error extracting data from file:', error);
    throw error;
  }
};

// Invoke LLM (OpenAI) for text generation
export const InvokeLLM = async ({ prompt, systemPrompt = null }) => {
  try {
    const openai = (await import('../lib/openai')).default;
    
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    return {
      result: response.choices[0].message.content,
      usage: response.usage
    };
  } catch (error) {
    console.error('Error invoking LLM:', error);
    throw error;
  }
};

// Generate enhanced item description
export const GenerateItemDescription = async (itemData) => {
  try {
    const result = await generateItemDescription(itemData);
    return result;
  } catch (error) {
    console.error('Error generating description:', error);
    throw error;
  }
};

// Send email (using Supabase Edge Function - to be implemented)
export const SendEmail = async ({ to, subject, body }) => {
  try {
    // This would typically call a Supabase Edge Function
    // For now, we'll log it
    console.log('Email would be sent:', { to, subject, body });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Upload avatar
export const UploadAvatar = async ({ file }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    // Update profile with new avatar URL
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    return { avatar_url: publicUrl };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

export const Core = {
  InvokeLLM,
  SendEmail,
  UploadFile,
  ExtractDataFromUploadedFile,
  CreateFileSignedUrl,
  UploadPrivateFile
};
