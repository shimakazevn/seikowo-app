import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from "react-transition-group";
import Header from './component/Header';
import Footer from './component/Footer';
import { routes } from './routes.jsx';
import './App.scss';

function App() {
  return (
    <BrowserRouter future={{ 
      v7_startTransition: true,
      v7_relativeSplatPath: true 
    }}>
      <Header />
      <ContentWithTransitions />
      <Footer />
    </BrowserRouter>
  );
}

function ContentWithTransitions() {
  const location = useLocation();

  return (
    <TransitionGroup className={"content-wrapper"}>
      <CSSTransition 
        key={location.pathname} 
        classNames="fade" 
        timeout={300}
        mountOnEnter
        unmountOnExit
      >
        <Suspense fallback={
          <div className="loading">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        }>
          <Routes location={location}>
            {routes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          </Routes>
        </Suspense>
      </CSSTransition>
    </TransitionGroup>
  );
}

export default App;
