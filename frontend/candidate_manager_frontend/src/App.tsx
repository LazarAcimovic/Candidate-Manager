import { Outlet } from "react-router-dom";

function App() {
  return (
    <div className="app-container">
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
