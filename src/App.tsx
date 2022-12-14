import { Alert, AlertTitle, Box, LinearProgress } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Subscription } from 'rxjs';
import { authRoutes, menuRoutes, PATH_REDIRECT, routes } from './config/routing';
import { authService, cartProcessor, categoriesStore, productStore } from './config/servicesConfig';
import ErrorType from './models/error-types';
import { Product } from './models/product';
import { RouteType } from './models/route-type';
import { nonAuthorisedUser, UserData} from './models/user-data';
import { setCategories, setErrorCode, setProducts, setShoppingCart, setUserData } from './redux/actions';
import { errorCodeSelector, notificationSelector, userDataSelector } from './redux/store';
import Navigator from './components/UI/main-navigator';
import { emptyMessage, UserNotificationMessage } from './models/user-notification';
import MessageView from './components/UI/common/message-view';

function App() {

  const dispatch = useDispatch();

  const userData: UserData = useSelector(userDataSelector);
  const notificationMessage: UserNotificationMessage = useSelector(notificationSelector);
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
      if (!!userData.id) { authService.logout() }
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
        if (ud.id === '') {
          if (userData.id) { dispatch(setErrorCode(ErrorType.AUTH_ERROR)) }
          dispatch(setUserData(nonAuthorisedUser));
        } else {
          dispatch(setErrorCode(ErrorType.NO_ERROR));
          dispatch(setUserData(ud));
        }
      }
    })
  }

  // get categories
  useEffect(() => {
    categoriesStore.fetch().then((cat) => dispatch(setCategories(cat)))
  });

  //subscriber product
  useEffect(() => {
    const subscription = subscribeToProduct();
    return () => subscription.unsubscribe();
  }, [])

  function subscribeToProduct(): Subscription {
    return productStore.getAll().subscribe({
      next(product: Product[]) {
        dispatch(setProducts(product));
      }
    })
  }

  // get cart on mounting
  useEffect(() => {
    dispatch(setShoppingCart(cartProcessor.getShoppingCart()));
  }, []);

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
          <Navigator menuItems={menuItems} authItems={authItems} />
          {notificationMessage !== emptyMessage && <MessageView data={notificationMessage} />}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              overflowY: 'auto',
              flexGrow: 3
            }}
          >
            <Box
              sx={{
                display: 'flex',
                width: { xs: '100%', sm: '90%' },
                minHeight: '100%',
                height: 'fit-content'
              }}
            >
              <Routes>
                {getRoutes(relevantRoutes)}
                <Route path={'*'} element={<Navigate to={PATH_REDIRECT} />}></Route>
              </Routes>
            </Box>
          </Box>
        </React.Fragment>
      }
    </BrowserRouter>
  )
}

export default App;

// Routes managment
function getRoutes(routes: RouteType[]): React.ReactNode[] {
  return routes.map(el => <Route key={el.path} path={el.path} element={el.element} ></Route>)
}

function getRelevantRoutes(items: RouteType[], userData: UserData): RouteType[] {
  const isGuest = !userData.id;
  const isUser = (!!userData.id && !userData.isAdmin);
  const isAdmin = userData.isAdmin;

  const res = items.filter(route =>
    (route.isAdmin && route.isUser && route.isGuest) ||
    (isGuest && route.isGuest) ||
    ((isUser || isAdmin) && route.isUser && route.isAdmin) ||
    (isUser && route.isUser && !route.isAdmin) ||
    (isAdmin && route.isAdmin) ||
    (isUser && route.isUser)
  )

  return res;
}