import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Nav } from "./components/Nav.tsx";
import { ProductGrid } from "./pages/ProductGrid.tsx";
import { ProductDetail } from "./pages/ProductDetail.tsx";
import { Jobs } from "./pages/Jobs.tsx";

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProductGrid />} />
          <Route path="/design/:id" element={<ProductDetail />} />
          <Route path="/jobs" element={<Jobs />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
