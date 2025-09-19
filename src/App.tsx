
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import Mindmap from "./pages/mindmap/Map";
import Code from "./pages/code/Code";
import NewPost from "./pages/post/NewPost";
import PostList from "./pages/post/PostList.tsx";
import DetailPost from "./pages/post/DetailPost";
import Layout from "./layouts/Layout";
import OAuthCallback from "./pages/login/OAuthCallback";
import { MyPage } from "./pages/mypage/Mypage.tsx";

function App() {
  return (
    <Routes>
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      <Route path="/" element={<Navigate to="/login" />} />
      <Route element={<Layout />}>
        <Route path="login" element={<Login />} />
        <Route path="home" element={<Home />} />
        <Route path="code" element={<Code />} />
        <Route path="mindmap" element={<Mindmap />} />
        <Route path="posts" element={<PostList />}/>
        <Route path="post/new" element={<NewPost />}/>
        <Route path="post/:id" element={<DetailPost />} />
        <Route path="mypage" element={<MyPage />} />
      </Route>
      <Route path="mindmap/:id" element={<Mindmap />} />
    </Routes>


  );
}

export default App;