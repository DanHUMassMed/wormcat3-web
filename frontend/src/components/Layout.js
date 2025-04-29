import { Outlet, Link, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const Layout = () => {
 return (
    <>
        <Header />
        <main className="pt-24 px-4"><Outlet /></main>
        <Footer />
    </>
    );
};
export default Layout;