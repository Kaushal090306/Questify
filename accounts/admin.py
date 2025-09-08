from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile

class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ("id", "email", "role", "is_staff")
    list_filter = ("role", "is_staff")

    fieldsets = (
        (None, {"fields": ("email", "password", "role")}),
        ("Personal info", {"fields": ("first_name", "last_name")}),
        ("Permissions", {"fields": ("is_staff", "is_superuser", "groups", "user_permissions")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2", "role"),
        }),
    )

    search_fields = ("email",)
    ordering = ("email",)
    filter_horizontal = ()

admin.site.register(User, UserAdmin)
admin.site.register(Profile)
