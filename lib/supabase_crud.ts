import supabase from './supabase';

export type UserDetails = {
    uuid: string;
    first_name: string;
    last_name: string;
    email: string;
};

export async function getUsers() {
    const { data, error } = await supabase
        .from('user_details')
        .select('*');

    if (error) {
        throw error;
    }
    return data as UserDetails[];
}

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

export async function createUser(user: UserDetails) {
    const { data, error } = await supabase
        .from('user_details')
        .insert([user]);

    if (error) {
        throw error;
    }
    return data;
}

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
