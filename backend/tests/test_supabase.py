from src.services.supabase_service import supabase_service


def test_supabase_client_initialization():
    """Verify that SupabaseService can initialize a client using project environment variables."""
    client = supabase_service.client
    assert client is not None
    # Verify table query doesn't throw syntax error
    res = client.table("profiles").select("id").limit(1).execute()
    assert res.data is not None
