import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_KEY)

JWT_SECRET = os.environ.get("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7

BODY_SCANNER_API_KEY = os.environ.get("BODY_SCANNER_API_KEY", "[BODY_SCANNER_API_KEY]")
FACE_SCANNER_API_KEY = os.environ.get("FACE_SCANNER_API_KEY", "[FACE_SCANNER_API_KEY]")
FOOD_SCANNER_API_KEY = os.environ.get("FOOD_SCANNER_API_KEY", "[FOOD_SCANNER_API_KEY]")

STRIPE_PUBLIC_KEY = os.environ.get("STRIPE_PUBLIC_KEY", "[STRIPE_PUBLIC_KEY]")
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "[STRIPE_SECRET_KEY]")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "[STRIPE_WEBHOOK_SECRET]")

SUPPORT_EMAIL = os.environ.get("SUPPORT_EMAIL", "support@email.com")
NOREPLY_EMAIL = os.environ.get("NOREPLY_EMAIL", "noreply@email.com")
