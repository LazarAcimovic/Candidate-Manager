import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import HomePage from "../pages/HomePage";
import CandidateDetailsPage from "../pages/CandidateDetailsPage";
import AddCandidatePage from "../pages/AddCandidatePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "candidate/:id",
        element: <CandidateDetailsPage />,
      },
      {
        path: "add-candidate",
        element: <AddCandidatePage />,
      },
      {
        path: "*",
        element: <h1 className="p-4">404 - Page not found.</h1>,
      },
    ],
  },
]);
