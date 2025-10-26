

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabase";
import {
  Store,
  Package,
  Plus,
  User as UserIcon,
  Users,
  Settings,
  LogOut,
  Home,
  Palette,
  BarChart3,
  LayoutTemplate,
  Megaphone,
  Heart,
  Mail,
  Lock,
  FileText,
  Briefcase,
  ShoppingCart,
  Building,
  RefreshCw, // For Trade Offers
  DollarSign, // For Connect page
  Tag, // For Special Offers
  Clock, // For Payment Confirmations
  Luggage, // For Baggage
  ArrowUpRight, // For Become a Seller
  MessageSquare, // For Messages
  TrendingUp // For Promote Items
} from "lucide-react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import SellerBalanceWidget from "@/components/store/SellerBalanceWidget";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import NerdBackground from "@/components/ui/NerdBackground"; // Import the new component
import FloatingCameraButton from "@/components/camera/FloatingCameraButton";
// CartIcon removed - cart system scorched
import SuspensionBanner from "@/components/SuspensionBanner";
import AccountRestrictionBanner from "@/components/payment/AccountRestrictionBanner";
import { checkUserStatus, checkExpiredOrders } from "@/api/penalties";

const navigationItems = [
  {
    title: "Home",
    url: createPageUrl("Home"),
    icon: Home,
  },
  {
    title: "Marketplace",
    url: createPageUrl("Marketplace"),
    icon: Store,
  },
  {
    title: "Storefront",
    url: createPageUrl("Store"),
    icon: Building,
  },
  {
    title: "My Items",
    url: createPageUrl("MyItems"),
    icon: Package,
  },
  {
    title: "My Orders",
    url: createPageUrl("MyOrders"),
    icon: ShoppingCart,
  },
  {
    title: "Payment Confirmations",
    url: createPageUrl("PaymentConfirmations"),
    icon: Clock,
  },
  {
    title: "Special Offers",
    url: createPageUrl("SpecialOffers"),
    icon: Tag,
  },
  {
    title: "Add Item",
    url: createPageUrl("AddItem"),
    icon: Plus,
  },
  {
    title: "Become a Seller",
    url: createPageUrl("AccountTypeSelection"),
    icon: ArrowUpRight,
    individualOnly: true, // Only show to individual users
  },
  {
    title: "Seller Hub",
    url: createPageUrl("Connect"),
    icon: DollarSign,
  },
  {
    title: "Trade Offers",
    url: createPageUrl("TradeOffers"),
    icon: RefreshCw,
  },
  {
    title: "Promote Items",
    url: createPageUrl("PromoteItem"),
    icon: TrendingUp,
  },
  {
    title: "Requests",
    url: createPageUrl("Requests"),
    icon: Briefcase,
  },
  {
    title: "Announcements",
    url: createPageUrl("Announcements"),
    icon: Megaphone,
  },
  {
    title: "Donations",
    url: createPageUrl("Donations"),
    icon: Heart,
  },
  {
    title: "Users",
    url: createPageUrl("Users"),
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Baggage",
    url: createPageUrl("Baggage"),
    icon: Luggage,
    adminOnly: true,
  },
  {
    title: "Messages",
    url: createPageUrl("Messages"),
    icon: MessageSquare,
  },
  {
    title: "Wish Lists",
    url: createPageUrl("WishLists"),
    icon: Heart,
  },
  {
    title: "Advertisements",
    url: createPageUrl("Advertisements"),
    icon: BarChart3,
    adminOnly: true,
  },
  {
    title: "Homepage Editor",
    url: createPageUrl("HomepageEditor"),
    icon: LayoutTemplate,
    adminOnly: true,
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
    adminOnly: true,
  },
  {
    title: "Theme Settings",
    url: createPageUrl("ThemeSettings"),
    icon: Palette,
    adminOnly: true,
  }
];

const publicPages = ["Home", "Contact", "Privacy", "Terms", "Announcements", "Donations", "AccountTypeSelection", "BusinessSignup", "SignIn"];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState(null);

  // Force sidebar to start collapsed by setting cookie
  useEffect(() => {
    document.cookie = 'sidebar_state=false; path=/; max-age=604800';
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setCurrentUser(null);
          setUserStatus(null);
          return;
        }

        if (session?.user) {
          // Get user profile from profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching user profile:', profileError);
            // Use basic user info from auth
            setCurrentUser({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.email,
              account_type: 'individual',
              role: 'user'
            });
          } else {
            setCurrentUser(profile);
            
            // Check user status (suspension/ban) and check for expired orders
            const status = await checkUserStatus(session.user.id);
            setUserStatus(status);
            
            // Check for expired orders in the background
            checkExpiredOrders().catch(err => console.error('Error checking expired orders:', err));
          }
        } else {
          setCurrentUser(null);
          setUserStatus(null);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setCurrentUser(null);
        setUserStatus(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [location.pathname, currentPageName, navigate]);

  const handleLogout = async () => {
    try {
      await User.signOut();
      setCurrentUser(null);
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // Show suspension/ban screen if user is suspended or banned (exclude admin and super_admin)
  if (currentUser && userStatus && (userStatus.isSuspended || userStatus.isBanned) && 
      currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
    return <SuspensionBanner userStatus={userStatus} onLogout={handleLogout} />;
  }

  // Redirect non-logged-in users to Home page (disabled for now to allow login)
  // TODO: Re-enable after login flow is working
  /*
  useEffect(() => {
    const isPublicPage = publicPages.includes(currentPageName);
    const homePath = createPageUrl("Home");
    
    if (!loading && !currentUser && !isPublicPage && location.pathname !== homePath) {
      navigate(homePath);
    }
  }, [currentUser, loading, currentPageName, navigate, location.pathname]);
  */

  // Show sidebar even when not authenticated, but with limited navigation
  // Allow admin and super_admin to see admin-only items
  // Show individual-only items only to individual users
  const visibleNavItems = navigationItems.filter(item => {
    // Filter out admin-only items unless user is admin/super_admin
    if (item.adminOnly && !(currentUser?.role === 'admin' || currentUser?.role === 'super_admin')) {
      return false;
    }
    
    // Filter out individual-only items unless user is individual
    if (item.individualOnly && currentUser?.account_type !== 'individual') {
      return false;
    }
    
    return true;
  });

  return (
    <SidebarProvider defaultOpen={false}>
      <LayoutContent 
        currentUser={currentUser}
        currentPageName={currentPageName}
        visibleNavItems={visibleNavItems}
        handleLogout={handleLogout}
      >
        {children}
      </LayoutContent>
    </SidebarProvider>
  );
}

// Internal component that has access to useSidebar
function LayoutContent({ currentUser, currentPageName, visibleNavItems, handleLogout, children }) {
  const { open } = useSidebar();

  return (
    <div className="relative min-h-screen flex w-full bg-slate-950 text-gray-200 overflow-hidden">
      <NerdBackground count={75} />
      {currentUser && currentPageName !== 'Home' && <FloatingCameraButton />}

      {/* Only show sidebar if user is logged in */}
      {currentUser && (
        <Sidebar 
          className="border-r-0 bg-gray-900/90 backdrop-blur-lg shadow-2xl border-r border-gray-800 z-10" 
          collapsible="offcanvas"
          variant="sidebar"
        >
          <SidebarHeader className="border-b border-gray-800 shrink-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild tooltip="BlockSwap">
                  <Link to={createPageUrl("Marketplace")}>
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <span className="flex flex-col">
                      <span className="font-bold text-base text-white">BlockSwap</span>
                      <span className="text-xs text-gray-400">Local Marketplace</span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent className="p-3 flex flex-col justify-between h-[calc(100%-85px)]">
            {/* Seller Balance Widget */}
            {currentUser?.account_type === 'seller' && (
              <div className="mb-3">
                <SellerBalanceWidget userId={currentUser.id} />
              </div>
            )}

            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {visibleNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        className={`group hover:bg-gray-800 transition-all duration-300 rounded-lg p-2.5 justify-start text-sm ${
                          location.pathname === item.url
                            ? 'bg-pink-500/10 text-pink-400'
                            : 'text-gray-400 hover:text-white'
                        }`}
                        data-tour={
                          item.title === 'My Items' ? 'sidebar-my-items' :
                          item.title === 'Add Item' ? 'sidebar-add-item' :
                          item.title === 'Trade Offers' ? 'sidebar-trade-offers' :
                          item.title === 'Requests' ? 'sidebar-requests' :
                          undefined
                        }
                      >
                        <Link to={item.url}>
                          <item.icon className="w-4 h-4 shrink-0" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className={`group hover:bg-gray-800 transition-all duration-300 rounded-lg p-2.5 justify-start text-sm ${
                        location.pathname === createPageUrl("Contact")
                          ? 'bg-pink-500/10 text-pink-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Link to={createPageUrl("Contact")}>
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="font-medium">Contact Us</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className={`group hover:bg-gray-800 transition-all duration-300 rounded-lg p-2.5 justify-start text-sm ${
                        location.pathname === createPageUrl("Privacy")
                          ? 'bg-pink-500/10 text-pink-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Link to={createPageUrl("Privacy")}>
                        <Lock className="w-4 h-4 shrink-0" />
                        <span className="font-medium">Privacy Policy</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className={`group hover:bg-gray-800 transition-all duration-300 rounded-lg p-2.5 justify-start text-sm ${
                        location.pathname === createPageUrl("Terms")
                          ? 'bg-pink-500/10 text-pink-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Link to={createPageUrl("Terms")}>
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="font-medium">Terms of Service</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
                <SidebarMenu>
                    {currentUser ? (
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Log Out" onClick={handleLogout} className="group hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 rounded-lg p-2.5 justify-start text-gray-400 text-sm">
                               <LogOut className="w-4 h-4 mr-2.5 shrink-0" />
                               <span className="font-medium">Log Out</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ) : (
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Log In" className="group hover:bg-green-500/10 hover:text-green-400 transition-all duration-300 rounded-lg p-2.5 justify-start text-gray-400 text-sm">
                                <Link to={createPageUrl("SignIn")}>
                                    <UserIcon className="w-4 h-4 shrink-0" />
                                    <span className="font-medium">Log In</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      )}

        <main className="flex-1 flex flex-col z-10 min-w-0">
          {/* Fixed Floating Hamburger Menu - Only show if logged in and NOT on Home page */}
          {currentUser && currentPageName !== 'Home' && (
            <div 
              className={`fixed top-6 z-50 transition-all duration-300 ${
                open ? 'left-[270px]' : 'left-6'
              }`}
            >
              <SidebarTrigger className="w-16 h-16 flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-cyan-500/50 hover:scale-110">
                <span className="text-white text-4xl font-light" style={{ fontFamily: 'Hugeicons' }}>&#987985;</span>
              </SidebarTrigger>
            </div>
          )}

          {/* Cart icon removed - cart system scorched */}

          <div className="flex-1">
            {/* Account Restriction Banner */}
            {currentUser && (
              <AccountRestrictionBanner userId={currentUser.id} />
            )}
            {children}
          </div>
        </main>
      </div>
  );
}
