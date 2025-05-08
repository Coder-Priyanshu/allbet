from django.urls import path
from . import views
from . import api_views

urlpatterns = [
    # HTML template views
    path('', views.index, name='index'),
    path('api-test.html', views.api_test, name='api-test'),
    path('livecasino.html', views.livecasino, name='livecasino'),
    path('slot.html', views.slot, name='slot'),
    path('fantasy.html', views.fantasy, name='fantasy'),
    path('createaccount.html', views.createaccount, name='createaccount'),

    # API endpoints
    path('api/register/', api_views.RegisterView.as_view(), name='api-register'),
    path('api/login/', api_views.LoginView.as_view(), name='api-login'),
    path('api/logout/', api_views.LogoutView.as_view(), name='api-logout'),
    path('api/user/', api_views.UserDetailView.as_view(), name='api-user-detail'),
    path('api/user/update/', api_views.UserUpdateView.as_view(), name='api-user-update'),
    path('api/user/change-password/', api_views.ChangePasswordView.as_view(), name='api-change-password'),
]
