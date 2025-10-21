import Layout from "./Layout.jsx";

import Marketplace from "./Marketplace";

import MyItems from "./MyItems";

import AddItem from "./AddItem";

import Users from "./Users";

import Home from "./Home";

import Settings from "./Settings";

import Advertisements from "./Advertisements";

import HomepageEditor from "./HomepageEditor";

import Contact from "./Contact";

import Privacy from "./Privacy";

import Terms from "./Terms";

import Announcements from "./Announcements";

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

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Marketplace: Marketplace,
    
    MyItems: MyItems,
    
    AddItem: AddItem,
    
    Users: Users,
    
    Home: Home,
    
    Settings: Settings,
    
    Advertisements: Advertisements,
    
    HomepageEditor: HomepageEditor,
    
    Contact: Contact,
    
    Privacy: Privacy,
    
    Terms: Terms,
    
    Announcements: Announcements,
    
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
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Marketplace />} />
                
                
                <Route path="/Marketplace" element={<Marketplace />} />
                
                <Route path="/MyItems" element={<MyItems />} />
                
                <Route path="/AddItem" element={<AddItem />} />
                
                <Route path="/Users" element={<Users />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Advertisements" element={<Advertisements />} />
                
                <Route path="/HomepageEditor" element={<HomepageEditor />} />
                
                <Route path="/Contact" element={<Contact />} />
                
                <Route path="/Privacy" element={<Privacy />} />
                
                <Route path="/Terms" element={<Terms />} />
                
                <Route path="/Announcements" element={<Announcements />} />
                
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