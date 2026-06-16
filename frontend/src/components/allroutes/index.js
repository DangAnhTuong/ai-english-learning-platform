import React, { Suspense } from "react";
import { useRoutes } from "react-router-dom";
import { routes } from "../../routes";
import { Spin } from "antd";

function Allroutes(){
    const allroute = useRoutes(routes);
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" tip="Đang tải..." />
            </div>
        }>
            {allroute}
        </Suspense>
    )
}
export default Allroutes;