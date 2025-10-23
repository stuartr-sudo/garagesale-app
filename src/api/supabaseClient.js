import { supabase } from '../lib/supabase';

// Base entity class for common CRUD operations
export class BaseEntity {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async create(data) {
    try {
      // TEMPORARILY: Add guest user ID if no seller_id provided
      if (!data.seller_id && this.tableName === 'items') {
        data.seller_id = 'guest-user';
      }
      if (!data.user_id && this.tableName === 'requests') {
        data.user_id = 'guest-user';
      }
      
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();
      
      if (error) {
        console.warn('Database insert failed, using mock data:', error);
        // Return mock success for now
        return { ...data, id: 'mock-' + Date.now() };
      }
      return result;
    } catch (error) {
      console.warn('Create operation failed:', error);
      return { ...data, id: 'mock-' + Date.now() };
    }
  }

  async get(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async filter(filters = {}, orderBy = null) {
    let query = supabase.from(this.tableName).select('*');
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
    
    // Apply ordering
    if (orderBy) {
      const descending = orderBy.startsWith('-');
      const column = descending ? orderBy.slice(1) : orderBy;
      query = query.order(column, { ascending: !descending });
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  async update(id, data) {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }

  async delete(id) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  async list(limit = 100, offset = 0) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  }
}

// User/Auth class
export class UserEntity {
  async me() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) throw new Error('Not authenticated');
      
      // Get full profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      return profile;
    } catch (error) {
      // TEMPORARILY: Return guest user if not authenticated
      throw error; // Still throw so Layout can catch and create guest user
    }
  }

  async get(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    
    if (error) throw error;
    return data;
  }

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) throw error;
    return data;
  }

  async loginWithRedirect(redirectUrl) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
    
    if (error) throw error;
    return data;
  }

  async updateProfile(updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }

  async list(orderBy = 'created_at') {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order(orderBy.startsWith('-') ? orderBy.substring(1) : orderBy, { 
        ascending: !orderBy.startsWith('-') 
      });
    
    if (error) throw error;
    return data || [];
  }

  async filter(filters = {}, orderBy = 'created_at') {
    let query = supabase
      .from('profiles')
      .select('*');
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'role') {
          query = query.eq(key, value);
        } else if (key === 'account_type') {
          query = query.eq(key, value);
        } else if (key === 'country') {
          query = query.eq(key, value);
        } else if (key === 'postcode') {
          query = query.ilike(key, `%${value}%`);
        } else if (key === 'full_name') {
          query = query.ilike(key, `%${value}%`);
        } else if (key === 'email') {
          query = query.ilike(key, `%${value}%`);
        }
      }
    });
    
    // Apply ordering
    if (orderBy) {
      const ascending = !orderBy.startsWith('-');
      const field = orderBy.startsWith('-') ? orderBy.substring(1) : orderBy;
      query = query.order(field, { ascending });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateMyUserData(updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

export default supabase;

