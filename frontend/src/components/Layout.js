import { Outlet, Link, useLocation } from "react-router-dom";
import Header from "./Header";
import Usage_RGS from "./Useage_RGS";
import Citation from "./Citation";
import Footer from "./Footer";

const Layout = () => {
 return (
    <>
        <Header />
        <main className="pt-24 px-4"><Outlet /></main>
        <Usage_RGS/>
        <Citation/>
        <Footer />
    </>
    );
};
export default Layout;