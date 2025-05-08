from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from .serializers import (
    UserSerializer,
    LoginSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Create token for the new user
        token, created = Token.objects.get_or_create(user=user)

        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": token.key,
            "message": "User registered successfully"
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        print("Login attempt with data:", request.data)

        # Check if we're receiving email or username
        if 'email' in request.data and not 'username' in request.data:
            # Try to find the user by email
            try:
                user_obj = User.objects.get(email=request.data['email'])
                # Add username to the request data
                request.data['username'] = user_obj.username
                print(f"Found user with email {request.data['email']}, username: {user_obj.username}")
            except User.DoesNotExist:
                print(f"No user found with email {request.data['email']}")
                return Response({
                    "message": "No user found with this email address",
                    "userExists": False
                }, status=status.HTTP_401_UNAUTHORIZED)

        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get credentials
        username = serializer.validated_data.get('username')
        email = serializer.validated_data.get('email')
        password = serializer.validated_data.get('password')

        print(f"Attempting authentication with username: {username}, email: {email}")

        # Try to authenticate with username
        if username:
            user = authenticate(username=username, password=password)
        # Try to authenticate with email
        elif email:
            try:
                user_obj = User.objects.get(email=email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
        else:
            user = None

        if user:
            login(request, user)
            token, created = Token.objects.get_or_create(user=user)
            user_data = UserSerializer(user).data
            print(f"Login successful for user: {user.username}")
            print(f"Token: {token.key}")
            print(f"User data: {user_data}")

            return Response({
                "user": user_data,
                "token": token.key,
                "message": "Login successful"
            }, status=status.HTTP_200_OK)
        else:
            print(f"Authentication failed for username: {username}, email: {email}")

            # Check if user exists
            user_exists = False
            if username:
                user_exists = User.objects.filter(username=username).exists()
            elif email:
                user_exists = User.objects.filter(email=email).exists()

            print(f"User exists: {user_exists}")

            return Response({
                "message": "Invalid credentials",
                "userExists": user_exists
            }, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        print("Logout attempt")

        # Check for token in the Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            print(f"Token found in header: {token_key}")

            try:
                token = Token.objects.get(key=token_key)
                user = token.user
                print(f"Found token for user: {user.username}")

                # Delete the token to logout
                token.delete()
                logout(request)
                return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
            except Token.DoesNotExist:
                print("Token not found in database")
                return Response({"message": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

        # If we're here, no valid token was found
        if request.user.is_authenticated:
            print(f"User is authenticated: {request.user.username}")
            Token.objects.filter(user=request.user).delete()
            logout(request)
            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)

        print("No token found and user is not authenticated")
        return Response({"message": "You are not logged in."}, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        print("User detail request")

        # Check for token in the Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            print(f"Token found in header: {token_key}")

            try:
                token = Token.objects.get(key=token_key)
                user = token.user
                print(f"Found token for user: {user.username}")

                # Return user details
                return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
            except Token.DoesNotExist:
                print("Token not found in database")
                return Response({"message": "Invalid token."}, status=status.HTTP_401_UNAUTHORIZED)

        # If we're here, no valid token was found
        if request.user.is_authenticated:
            print(f"User is authenticated: {request.user.username}")
            return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)

        print("No token found and user is not authenticated")
        return Response({"message": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

class UserUpdateView(generics.UpdateAPIView):
    serializer_class = UserUpdateSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            "user": UserSerializer(instance).data,
            "message": "User updated successfully"
        })

class ChangePasswordView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check old password
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)

        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        # Update token
        Token.objects.filter(user=user).delete()
        token, created = Token.objects.get_or_create(user=user)

        return Response({
            "message": "Password updated successfully",
            "token": token.key
        }, status=status.HTTP_200_OK)
