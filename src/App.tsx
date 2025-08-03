import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import Mindmap from "./pages/mindmap/Map";
import Code from "./pages/code/Code";
import Meeting from "./pages/meeting/MeetingRoom";
import Layout from "./layouts/Layout";
import OAuthCallback from "./pages/login/OAuthCallback";
function App() {
  return (
    <Routes>
      <Route path="/oauth/callback" element={<OAuthCallback />} /> 

      <Route path="/" element={<Navigate to="/login" />} />
      <Route element={<Layout />}>
        <Route path="login" element={<Login />} />
        <Route path="home" element={<Home />} />
        <Route path="mindmap/:id" element={<Mindmap />} />
        <Route path="code" element={<Code />} />
        <Route path="meeting" element={<Meeting />} />
      </Route>
    </Routes>

  );
}

export default App;

