import { Routes, Route } from "react-router-dom"; // Remove ScrollRestoration
import HomePage from "./pages/HomePage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Policy from "./pages/Policy";
import Pagenotfound from "./pages/Pagenotfound";
import Register from "./pages/Auth/Register";
import Login from "./pages/Auth/Login";
import Dashboard from "./pages/user/Dashboard";
import PrivateRoute from "./components/Routes/Private";
import ForgotPasssword from "./pages/Auth/ForgotPasssword";
import AdminRoute from "./components/Routes/AdminRoute";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import CreateCategory from "./pages/Admin/CreateCategory";
import SubcategoryList from "./pages/Admin/subCategory";
import BrandList from "./pages/Admin/brandList";
import MinimumOrder from "./pages/Admin/minimumOrder.jsx";
import CreateProduct from "./pages/Admin/CreateProduct";
import Users from "./pages/Admin/Users";
import UsersLists from "./pages/Admin/userCartLists";
import Orders from "./pages/user/Orders";
import Profile from "./pages/user/Profile";
import Products from "./pages/Admin/Products";
import UpdateProduct from "./pages/Admin/UpdateProduct";
import Search from "./pages/Search";
import ProductDetails from "./pages/ProductDetails";
import Categories from "./pages/Categories";
import CategoryProduct from "./pages/CategoryProduct";
import CartPage from "./pages/cart/CartPage.jsx";
import AdminOrders from "./pages/Admin/Admin order/AdminOrders.jsx";
import PincodeList from "./pages/Admin/PinCode.jsx";
import Terms from "./pages/TermsofUse";
import ReturnPolicy from "./pages/returnPolicy.jsx";
import BannerManagement from "./pages/Admin/bannerManagement";
import ProductForYou from "./pages/Admin/ProductForYou.jsx";
import WishlistPage from "./pages/wishlists.jsx";
import AddToCartPage from "./pages/Admin/userCart.jsx";

import AdminLogin from "./pages/Auth/AdminLog.jsx";
// Import Redux provider and store
import { Provider } from 'react-redux';
import store from './redux/store';
import ScrollToTop from './components/ScrollToTop'; // Ensure correct import

function App() {

  return (
    <Provider store={store}>
      <ScrollToTop /> {/* Using ScrollToTop component */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/cart" element={<CartPage />} />
      
        <Route path="/category/:slug" element={<CategoryProduct />} />
        <Route path="/search" element={<Search />} />
        <Route path="/dashboard" element={<PrivateRoute />}>
          <Route path="user" element={<Dashboard />} />
          <Route path="user/orders" element={<Orders />} />
          <Route path="user/profile" element={<Profile />} />
        </Route>
        <Route path="/dashboard" element={<AdminRoute />}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/create-category" element={<CreateCategory />} />
          <Route path="admin/create-subcategory" element={<SubcategoryList />} />
          <Route path="admin/brand" element={<BrandList />} />
          <Route path="admin/minimumOrder" element={<MinimumOrder />} />
          
          <Route path="admin/create-product" element={<CreateProduct />} />
          <Route path="admin/create-banner" element={<BannerManagement />} />
          <Route path="admin/product/:slug" element={<UpdateProduct />} />
          <Route path="admin/products" element={<Products />} />
          <Route path="admin/users" element={<Users />} />

          
          <Route path="admin/UsersLists" element={<UsersLists />} />
          <Route path="admin/orders" element={<AdminOrders />} />
          <Route path="admin/pincodes" element={<PincodeList />} />
          <Route path="admin/productforyou" element={<ProductForYou />} />
        </Route>
      
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPasssword />} />
        <Route path="/login" element={<Login />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/policy" element={<Policy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/returnPolicy" element={<ReturnPolicy />} />
        <Route path="/add-to-cart/:userId/:user_fullname" element={<AddToCartPage />} />

        <Route path="*" element={<Pagenotfound />} />
      </Routes>
    </Provider>
  );
}

export default App;
