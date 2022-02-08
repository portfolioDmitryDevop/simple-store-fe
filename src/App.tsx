import { Alert, AlertTitle, LinearProgress } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Subscription } from 'rxjs';
import { authRoutes, menuRoutes, routes } from './config/routing';
import { authService, categoriesStore, clientStore, productStore, orderStore } from './config/servicesConfig';
import { Category } from './models/category-type';
import ErrorType from './models/error-types';
import { Product } from './models/product';
import { RouteType } from './models/route-type';
import { nonAuthorisedUser, UserData } from './models/user-data';
import { setCategories, setErrorCode, setProducts, setUserData, setClients, setOrders } from './redux/actions';
import { errorCodeSelector, userDataSelector } from './redux/store';
import Navigator from './components/UI/common/navigator';
import { Client } from './models/client-type';
import { Order } from './models/order-type';

function App() {

  const dispatch = useDispatch();

  const userData: UserData = useSelector(userDataSelector);

  const relevantRoutes = useMemo(() => getRelevantRoutes(routes, userData), [userData]);
  const menuItems = useMemo(() => getRelevantRoutes(menuRoutes, userData), [userData]);
  const authItems = useMemo(() => getRelevantRoutes(authRoutes, userData), [userData]);

  // Error Handling
  const code: ErrorType = useSelector(errorCodeSelector);
  const [serverUnavailable, setServerUnavailable] = useState(false);
  useMemo(() => handleError(), [code]);

  function handleError() {
    if (code === ErrorType.NO_ERROR) {
      serverUnavailable && setServerUnavailable(false);
    } else if (code === ErrorType.AUTH_ERROR) {
      if (!!userData.userName) { authService.logout(); console.log('auth error') }
      serverUnavailable && setServerUnavailable(false);
    } else {
      !serverUnavailable && setServerUnavailable(true);
    }
  }

  // Subscribe User Token
  useEffect(() => {
    let subscriptionToUserToken = subscribeToUserToken();
    return () => subscriptionToUserToken.unsubscribe();
  }, []);

  function subscribeToUserToken() {
    return authService.getUserData().subscribe({
      next(ud) {
        if (ud.displayName === '') {
          if (userData.displayName) {
            dispatch(setErrorCode(ErrorType.AUTH_ERROR));
          }
          dispatch(setUserData(nonAuthorisedUser));
        } else {
          dispatch(setErrorCode(ErrorType.NO_ERROR));
          dispatch(setUserData(ud));
        }
      }
    })
  }

  // Subscribe to categories
  useEffect(() => {
    const subscription = subscribeToCategories();
    return () => subscription.unsubscribe();
  }, [])

  function subscribeToCategories(): Subscription {
    return categoriesStore.getAll().subscribe({
      next(cat: Category[]) {
        dispatch(setCategories(cat));
      }
    })
  }

  // Subscribe to products
  useEffect(() => {
    const subscription = subscribeToProduct();
    return () => subscription.unsubscribe();
  }, [])

  function subscribeToProduct(): Subscription {
    return productStore.getAll().subscribe({
      next(prod: Product[]) {
        dispatch(setProducts(prod));
      }
    })
  }

  //subscriber clients
  useEffect(() => {
    const subscription = subscribeToClients();
    return () => subscription.unsubscribe();
  }, [])

  function subscribeToClients(): Subscription {
    return clientStore.getAll().subscribe({
      next(clients: Client[]) {
        dispatch(setClients(clients));
      }
    })
  }

  //subscriber orders
  useEffect(() => {
    const subscription = subscribeToOrders();
    return () => subscription.unsubscribe();
  }, [])

  function subscribeToOrders(): Subscription {
    return orderStore.getAll().subscribe({
      next(orders: Order[]) {
        dispatch(setOrders(orders));
      }
    })
  }

  return (
    <BrowserRouter>
      {/* Show Alert if Connection refused*/}
      {serverUnavailable
        ? <React.Fragment>
          <Alert severity="error">
            <AlertTitle>Error connecting to the database.</AlertTitle>
            <strong>Trying to reconnect...</strong>
          </Alert>
          <LinearProgress sx={{ width: '100%' }} />
        </React.Fragment>
        : <React.Fragment>
          <Navigator logo={'BEST PIZZA B7'} menuItems={menuItems} authItems={authItems} />
          <Routes>
            {getRoutes(relevantRoutes)}
            <Route path={'*'} element={<Navigate to={relevantRoutes[0].path} />}></Route>
          </Routes>
        </React.Fragment>
      }
    </BrowserRouter>
  )
}

export default App;

// Routes managment
function getRoutes(routes: RouteType[]): React.ReactNode[] {
  return routes.map(el => <Route key={el.label} path={el.path} element={el.element} ></Route>)
}

function getRelevantRoutes(items: RouteType[], userData: UserData): RouteType[] {
  const isGuest = !userData.displayName;
  const isUser = (!!userData.displayName && !userData.isAdmin);
  const isAdmin = userData.isAdmin;

  // console.log("isGuest:" + isGuest + " isUser:" + isUser + " isAdmin:" + isAdmin);

  const res = items.filter(route =>
    (route.isAdmin && route.isUser && route.isGuest) ||
    (isGuest && route.isGuest) ||
    ((isUser || isAdmin) && route.isUser && route.isAdmin) ||
    (isUser && route.isUser && !route.isAdmin) ||
    (isAdmin && route.isAdmin) ||
    (isUser && route.isUser)
  )

  // console.log(res);


  return res;
}