# OLD:
# load_dotenv(BASE_DIR / '.env')

# NEW:
# Use this if you keep .env inside the inner backend folder
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Try loading from root, then try inside the 'backend' folder
env_path = BASE_DIR / '.env'
if not env_path.exists():
    env_path = BASE_DIR / 'backend' / '.env'

load_dotenv(env_path)


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# Now fetches from .env, with a fallback just in case
SECRET_KEY = os.getenv('SECRET_KEY', 'unsafe-fallback-key')

# SECURITY WARNING: don't run with debug turned on in production!
# Strip spaces to ensure 'True ' becomes 'True'
# This strips invisible spaces and handles 'True', 'true', or '1'
DEBUG = str(os.getenv('DEBUG', 'False')).strip().lower() in ['true', '1', 't']

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # MAKE SURE THESE TWO LINES ARE HERE:
    'corsheaders',
    'rest_framework',
    'inventory', 
    'rest_framework_simplejwt',
]
# Add this to the bottom of settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # <--- THIS IS THE MISSING KEY!
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': '5432',
    }
}


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Asia/Kolkata"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = "static/"

# --- SECURITY LOCKDOWN ---

# 1. Disable Debugging (Hides secrets when errors happen)
DEBUG = False

# 2. Only allow YOUR website IP/Domain
# (If testing locally, keep 'localhost'. When you buy a domain, add it here)
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]']

# 3. CORS: Block all other websites
CORS_ALLOW_ALL_ORIGINS = False 

# 4. Whitelist ONLY your Frontend URL
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Your React Localhost
    # "https://www.your-real-website.com",  <-- Uncomment this when you buy a domain
]
