"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react"; // Added UserIcon for fallback

export const UserProfile = () => {
  const { user, signOutUser } = useAuth();

  if (!user) {
    return null; // Or some other placeholder if needed when user is not logged in
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return <UserIcon size={20} />;
    const names = name.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 flex items-center space-x-3 border-b border-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              {user.photoURL ? (
                <AvatarImage src={user.photoURL} alt={user.displayName || "User"} />
              ) : null}
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.displayName || "User"}
              </p>
              {user.email && (
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOutUser} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex flex-col">
        <span className="text-sm font-semibold">{user.displayName || "Authenticated User"}</span>
        {user.email && <span className="text-xs text-muted-foreground">{user.email}</span>}
      </div>
    </div>
  );
};
