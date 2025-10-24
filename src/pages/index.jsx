import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

// Eager load critical pages (Layout + frequently accessed pages)
import Layout from "./Layout.jsx";
import Marketplace from "./Marketplace"; // Eager load - most visited page
import ItemDetail from "./ItemDetail"; // Eager load - frequently accessed
import MyItems from "./MyItems"; // Eager load - seller's main page

// Lazy load less frequently accessed pages for code splitting
const AddItem = lazy(() => import("./AddItem"));
const EditItem = lazy(() => import("./EditItem"));
const Users = lazy(() => import("./Users"));
const Home = lazy(() => import("./Home"));
const Settings = lazy(() => import("./Settings"));
const Advertisements = lazy(() => import("./Advertisements"));
const HomepageEditor = lazy(() => import("./HomepageEditor"));
const Contact = lazy(() => import("./Contact"));
const Privacy = lazy(() => import("./Privacy"));
const Terms = lazy(() => import("./Terms"));
const Announcements = lazy(() => import("./Announcements"));
const AnnouncementEditor = lazy(() => import("./AnnouncementEditor"));
const Donations = lazy(() => import("./Donations"));
const Requests = lazy(() => import("./Requests"));
const AddRequest = lazy(() => import("./AddRequest"));
const MyPurchases = lazy(() => import("./MyPurchases"));
const Connect = lazy(() => import("./Connect"));
const AddProduct = lazy(() => import("./AddProduct"));
const Store = lazy(() => import("./Store"));
const Success = lazy(() => import("./Success"));
const Onboarding = lazy(() => import("./Onboarding"));
const BusinessOnboarding = lazy(() => import("./BusinessOnboarding"));
const BusinessSignup = lazy(() => import("./BusinessSignup"));
const AccountTypeSelection = lazy(() => import("./AccountTypeSelection"));
const TradeOffers = lazy(() => import("./TradeOffers"));
const SignIn = lazy(() => import("./SignIn"));
const MyOrders = lazy(() => import("./MyOrders"));
const Cart = lazy(() => import("./Cart"));
const SpecialOffers = lazy(() => import("./SpecialOffers"));
const ThemeSettings = lazy(() => import("./ThemeSettings"));
const PaymentConfirmations = lazy(() => import("./PaymentConfirmations"));
const EmailTestPage = lazy(() => import("./EmailTestPage"));
const Baggage = lazy(() => import("./Baggage"));
const PaymentWizardDemo = lazy(() => import("./PaymentWizardDemo"));
const Messages = lazy(() => import("./Messages"));
const WishLists = lazy(() => import("./WishLists"));
const PromoteItem = lazy(() => import("./PromoteItem"));

// Loading component - Minimal, non-intrusive loader
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-pulse space-y-4 w-full max-w-4xl px-4">
        {/* Skeleton loader instead of spinner - less jarring */}
        <div className="h-12 bg-gray-800 rounded-lg w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-64 bg-gray-800 rounded-lg"></div>
          <div className="h-64 bg-gray-800 rounded-lg"></div>
          <div className="h-64 bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    </div>
  </div>
);

const PAGES = {
    
    Marketplace: Marketplace,
    
    MyItems: MyItems,
    
    AddItem: AddItem,
    
    EditItem: EditItem,
    
    Users: Users,
    
    Home: Home,
    
    Settings: Settings,
    
    Advertisements: Advertisements,
    
    HomepageEditor: HomepageEditor,
    
    Contact: Contact,
    
    Privacy: Privacy,
    
    Terms: Terms,
    
    Announcements: Announcements,
    
    AnnouncementEditor: AnnouncementEditor,
    
    Donations: Donations,
    
    Requests: Requests,
    
    AddRequest: AddRequest,
    
    MyPurchases: MyPurchases,
    
    Connect: Connect,
    
    AddProduct: AddProduct,
    
    Store: Store,
    
    Success: Success,
    
    Onboarding: Onboarding,
    
    BusinessOnboarding: BusinessOnboarding,
    
    BusinessSignup: BusinessSignup,
    
    AccountTypeSelection: AccountTypeSelection,
    
    TradeOffers: TradeOffers,
    
    SignIn: SignIn,
    
    ItemDetail: ItemDetail,
    
    MyOrders: MyOrders,
    
    Cart: Cart,
    
    SpecialOffers: SpecialOffers,
    
    ThemeSettings: ThemeSettings,
    
    Baggage: Baggage,
    
    PaymentWizardDemo: PaymentWizardDemo,
    
    Messages: Messages,
    
    WishLists: WishLists,
    
    PromoteItem: PromoteItem,
    
}

function _getCurrentPage(url) {
    // Handle root path explicitly
    if (url === '/' || url === '') {
        return 'Home';
    }
    
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    
    // Handle ItemDetail pages - they should show cart and navigation
    if (url.includes('/ItemDetail/')) {
        return 'ItemDetail';
    }
    
    // Handle EditItem pages
    if (url.includes('/EditItem/')) {
        return 'EditItem';
    }
    
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || 'Home'; // Default to 'Home' instead of first page
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Suspense fallback={<PageLoader />}>
                <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Marketplace" element={<Marketplace />} />
                
                <Route path="/MyItems" element={<MyItems />} />
                
                <Route path="/AddItem" element={<AddItem />} />
                
                <Route path="/EditItem/:id" element={<EditItem />} />
                
                <Route path="/Users" element={<Users />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Advertisements" element={<Advertisements />} />
                
                <Route path="/HomepageEditor" element={<HomepageEditor />} />
                
                <Route path="/Contact" element={<Contact />} />
                
                <Route path="/Privacy" element={<Privacy />} />
                
                <Route path="/Terms" element={<Terms />} />
                
                <Route path="/Announcements" element={<Announcements />} />
                
                <Route path="/AnnouncementEditor" element={<AnnouncementEditor />} />
                
                <Route path="/Donations" element={<Donations />} />
                
                <Route path="/Requests" element={<Requests />} />
                
                <Route path="/AddRequest" element={<AddRequest />} />
                
                <Route path="/MyPurchases" element={<MyPurchases />} />
                
                <Route path="/Connect" element={<Connect />} />
                
                <Route path="/AddProduct" element={<AddProduct />} />
                
                <Route path="/Store" element={<Store />} />
                
                <Route path="/Success" element={<Success />} />
                
                <Route path="/Onboarding" element={<Onboarding />} />
                
                <Route path="/BusinessOnboarding" element={<BusinessOnboarding />} />
                
                <Route path="/BusinessSignup" element={<BusinessSignup />} />
                
                <Route path="/AccountTypeSelection" element={<AccountTypeSelection />} />
                
                <Route path="/TradeOffers" element={<TradeOffers />} />
                
                <Route path="/SignIn" element={<SignIn />} />
                
                <Route path="/ItemDetail/:id" element={<ItemDetail />} />
                
                <Route path="/MyOrders" element={<MyOrders />} />
                
                <Route path="/Cart" element={<Cart />} />
                
                <Route path="/SpecialOffers" element={<SpecialOffers />} />
                
                <Route path="/ThemeSettings" element={<ThemeSettings />} />
                
                <Route path="/PaymentConfirmations" element={<PaymentConfirmations />} />
                <Route path="/EmailTest" element={<EmailTestPage />} />
                <Route path="/Baggage" element={<Baggage />} />
                <Route path="/PaymentWizardDemo" element={<PaymentWizardDemo />} />
                <Route path="/Messages" element={<Messages />} />
                <Route path="/Messages/:conversationId" element={<Messages />} />
                <Route path="/WishLists" element={<WishLists />} />
                
                <Route path="/PromoteItem" element={<PromoteItem />} />
            </Routes>
            </Suspense>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}