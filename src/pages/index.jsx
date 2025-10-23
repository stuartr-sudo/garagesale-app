import Layout from "./Layout.jsx";

import Marketplace from "./Marketplace";

import MyItems from "./MyItems";

import AddItem from "./AddItem";

import EditItem from "./EditItem";

import Users from "./Users";

import Home from "./Home";

import Settings from "./Settings";

import Advertisements from "./Advertisements";

import HomepageEditor from "./HomepageEditor";

import Contact from "./Contact";

import Privacy from "./Privacy";

import Terms from "./Terms";

import Announcements from "./Announcements";

import AnnouncementEditor from "./AnnouncementEditor";

import Donations from "./Donations";

import Requests from "./Requests";

import AddRequest from "./AddRequest";

import MyPurchases from "./MyPurchases";

import Connect from "./Connect";

import AddProduct from "./AddProduct";

import Store from "./Store";

import Success from "./Success";

import Onboarding from "./Onboarding";

import BusinessOnboarding from "./BusinessOnboarding";

import BusinessSignup from "./BusinessSignup";

import AccountTypeSelection from "./AccountTypeSelection";

import TradeOffers from "./TradeOffers";

import SignIn from "./SignIn";

import ItemDetail from "./ItemDetail";

import MyOrders from "./MyOrders";

import Cart from "./Cart";

import SpecialOffers from "./SpecialOffers";

import ThemeSettings from "./ThemeSettings";

import PaymentConfirmations from "./PaymentConfirmations";
import EmailTestPage from "./EmailTestPage";
import Baggage from "./Baggage";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

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
            </Routes>
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