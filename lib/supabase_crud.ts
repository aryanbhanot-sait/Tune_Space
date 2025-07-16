import { supabase } from './supabase';

// Define the user type
export type UserDetails = {
    uuid: string;
    first_name: string;
    last_name: string;
    email: string;
};

// Read all users (generally not for regular users, but for admin/testing)
export async function getUsers() {
    const { data, error } = await supabase
        .from('user_details')
        .select('*');

    if (error) {
        throw error;
    }
    return data as UserDetails[]; // will likely be 0 or 1 for most RLS users
}

// Read single user by uuid
export async function getUserById(uuid: string) {
    const { data, error } = await supabase
        .from('user_details')
        .select('*')
        .eq('uuid', uuid)
        .single();

    if (error) {
        throw error;
    }
    return data as UserDetails;
}

// Create (insert) new user details
export async function createUser(user: UserDetails) {
    const { data, error } = await supabase
        .from('user_details')
        .insert([user]);

    if (error) {
        throw error;
    }
    return data;
}

// Update user details
export async function updateUser(uuid: string, updates: { first_name: string; last_name: string; email: string }) {
    const { data, error } = await supabase
        .from('user_details')
        .update(updates)
        .eq('uuid', uuid);

    if (error) {
        throw error;
    }
    return data;
}

// Delete user by uuid
export async function deleteUser(uuid: string) {
    const { data, error } = await supabase
        .from('user_details')
        .delete()
        .eq('uuid', uuid);

    if (error) {
        throw error;
    }
    return data;
}
