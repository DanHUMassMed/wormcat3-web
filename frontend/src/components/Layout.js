import { Outlet, Link, useLocation } from "react-router-dom";
import Header from "./Header";
import Usage_RGS from "./Useage_RGS";
import Usage_BatchRGS from "./Useage_BatchRGS";
import Usage_GSEA from "./Useage_GSEA";
import Citation from "./Citation";
import Footer from "./Footer";

const Layout = () => {
    const location = useLocation();
    const isRGSForm = location.pathname === "/"; 
    const isBatchForm = location.pathname === "/batch"; 
    const isGSEAForm = location.pathname === "/gsea"; 

    return (
        <>
            <Header />
            <main className="pt-14 px-4">
                <Outlet />
            </main>
            {isRGSForm && (
                <>
                    <Usage_RGS />
                    <Citation />
                </>
            )}
            {isBatchForm && (
                <>
                    <Usage_BatchRGS />
                    <Citation />
                </>
            )}
            {isGSEAForm && (
                <>
                    <Usage_GSEA />
                    <Citation />
                </>
            )}
            <Footer />
        </>
    );
};

export default Layout;