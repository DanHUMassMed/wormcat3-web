import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import UsageRGS from "./Useage_RGS";
import UsageBatchRGS from "./Useage_BatchRGS";
import UsageGSEA from "./Useage_GSEA";
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
                    <UsageRGS />
                    <Citation />
                </>
            )}
            {isBatchForm && (
                <>
                    <UsageBatchRGS />
                    <Citation />
                </>
            )}
            {isGSEAForm && (
                <>
                    <UsageGSEA />
                    <Citation />
                </>
            )}
            <Footer />
        </>
    );
};

export default Layout;