import { BaseEntity, UserEntity } from './supabaseClient';

// Export entity instances
export const Item = new BaseEntity('items');
export const Transaction = new BaseEntity('transactions');
export const Advertisement = new BaseEntity('advertisements');
export const HomepageContent = new BaseEntity('homepage_content');
export const Announcement = new BaseEntity('announcements');
export const Request = new BaseEntity('requests');
export const Rating = new BaseEntity('ratings');
export const Business = new BaseEntity('businesses');
export const TradeProposal = new BaseEntity('trade_proposals');
export const ContactRequest = new BaseEntity('contact_requests');

// Export User entity
export const User = new UserEntity();
