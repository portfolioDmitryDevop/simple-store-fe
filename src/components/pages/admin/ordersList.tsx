import * as React from 'react';
import { Popper, Box, IconButton, ListItem, Paper, Typography, Button } from '@mui/material';
import { FC, useMemo, useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Order, OrderStatus } from '../../../models/order-type';
import { clientsSelector, ordersSelector, productsSelector } from '../../../redux/store';
import { useMediaQuery } from "react-responsive";
import { DataGrid, GridActionsCellItem, GridColDef, GridRenderCellParams, GridRowHeightParams, GridRowId, GridRowParams, GridRowsProp, GridValueFormatterParams } from '@mui/x-data-grid';
import { getOrdersListFields, OrderListFields } from '../../../config/orders-list-columns';
import { Delete } from '@mui/icons-material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import { Product } from '../../../models/product';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import CommentIcon from '@mui/icons-material/Comment';
import { Subscription } from 'rxjs';
import { clientStore, orderStore } from '../../../config/servicesConfig';
import { setClients, setOrders } from '../../../redux/actions';
import { DeliveryAddress, UserData } from '../../../models/user-data';
import storeConfig from "../../../config/store-config.json"
import _ from 'lodash';
import { ConfirmationData, emptyConfirmationData } from '../../../models/common/confirmation-type';
import DialogConfirm from '../common/dialog';
import { getRandomInteger } from '../../../utils/common/random';
import ModalInfo from '../common/modal-info';

interface GridCellExpandProps {
  value: string;
  width: number;
}

const colotState = new Map([
  ["waiting", "orange"],
  ["working", "aqua"],
  ["complite", "lime"]
]);

const OrdersList: FC = () => {

  /* dialog confirmation */
  const confirmationData = React.useRef<ConfirmationData>(emptyConfirmationData);
  const [dialogVisible, setdialogVisible] = useState(false);

  /* dialog modal */
  const textModal = useRef<string[]>(['']);
  const [modalVisible, setModalVisible] = useState(false);

  function showDetails(id: GridRowId) {
    const order = orders.find(e => e.id === +id);
    if (!!order) {
      textModal.current = getInfoOrder(order);
    } else {
      textModal.current = ["Not found"];
    }
    setModalVisible(true);
  }

  //subscriber clients
  useEffect(() => {
    const subscription = subscribeToClients();
    return () => subscription.unsubscribe();
  }, [])

  function subscribeToClients(): Subscription {
    return clientStore.getAll().subscribe({
      next(clients: UserData[]) {
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


  //*************************Redux***************************//
  const dispatch = useDispatch();
  const orders: Order[] = useSelector(ordersSelector);
  const clients: UserData[] = useSelector(clientsSelector);
  const products: Product[] = useSelector(productsSelector);


  //********************Mobile or desktop********************//
  const isMobile = useMediaQuery({ maxWidth: 600, orientation: 'portrait' });
  const isLaptop = useMediaQuery({ maxWidth: 900 });
  const mode = useMemo(() => getMode(), [isMobile, isLaptop]);

  function getMode(): string {
    if (isMobile) {
      return 'isMobile';
    }
    if (isLaptop) {
      return 'isLaptop'
    }
    return 'isDesktop';
  }

  function isOverflown(element: Element): boolean {
    return (
      element.scrollHeight > element.clientHeight ||
      element.scrollWidth > element.clientWidth
    );
  }

  const GridCellExpand = React.memo(function GridCellExpand(
    props: GridCellExpandProps,
  ) {
    const { width, value } = props;
    const wrapper = React.useRef<HTMLDivElement | null>(null);
    const cellDiv = React.useRef(null);
    const cellValue = React.useRef(null);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [showFullCell, setShowFullCell] = React.useState(false);
    const [showPopper, setShowPopper] = React.useState(false);

    const handleMouseEnter = () => {
      const isCurrentlyOverflown = isOverflown(cellValue.current!);
      setShowPopper(isCurrentlyOverflown);
      setAnchorEl(cellDiv.current);
      setShowFullCell(true);
    };

    const handleMouseLeave = () => {
      setShowFullCell(false);
    };

    React.useEffect(() => {
      if (!showFullCell) {
        return undefined;
      }

      function handleKeyDown(nativeEvent: KeyboardEvent) {
        // IE11, Edge (prior to using Bink?) use 'Esc'
        if (nativeEvent.key === 'Escape' || nativeEvent.key === 'Esc') {
          setShowFullCell(false);
        }
      }

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [setShowFullCell, showFullCell]);

    return (
      <Box
        ref={wrapper}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          alignItems: 'center',
          lineHeight: '24px',
          width: 1,
          height: 1,
          position: 'relative',
          display: 'flex',
        }}
      >
        <Box
          ref={cellDiv}
          sx={{
            height: 1,
            width,
            display: 'block',
            position: 'absolute',
            top: 0,
          }}
        />
        <Box
          ref={cellValue}
          sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {value}
        </Box>
        {showPopper && (
          <Popper
            open={showFullCell && anchorEl !== null}
            anchorEl={anchorEl}
            style={{ width, marginLeft: -17 }}
          >
            <Paper
              elevation={1}
              style={{ minHeight: wrapper.current!.offsetHeight - 3 }}
            >
              {value.split('.').map(e => <Typography variant="body2" style={{ padding: 8 }}> {e} </Typography>)}
            </Paper>
          </Popper>
        )}
      </Box>
    );
  });

  function renderCellExpand(params: GridRenderCellParams<string>) {
    return (
      <GridCellExpand value={params.value || ''} width={params.colDef.computedWidth} />
    );
  }


  //************************Data Grid*************************//
  //column data grid
  const [columns, setColumns] = useState<GridColDef[]>([]);

  useEffect(() => {
    setColumns(getFilteredColumns(getOrdersListFields().get(mode) as OrderListFields[]));
  }, [mode]);

  function getFilteredColumns(fields: OrderListFields[]): any[] {
    return getColums().filter(column => fields.includes(column.field as any));
  }

  function getColums(): any[] {
    return [
      {
        field: "id", headerName: "Id order", flex: 30, align: 'center', headerAlign: 'center'
      },
      {
        field: "client", headerName: "Client", flex: 100, align: 'center', headerAlign: 'center'
      },
      {
        field: "address", headerName: "Address", flex: 100, align: 'center', headerAlign: 'center',
      },
      {
        field: "phone", headerName: "Phone", flex: 100, align: 'center', headerAlign: 'center'
      },
      {
        field: "product", headerName: "Product", flex: 150, align: 'center', headerAlign: 'center',
        renderCell: renderCellExpand
      },
      {
        field: "status", headerName: "Status", flex: 50, align: 'center', headerAlign: 'center',
        editable: "true", type: "singleSelect", valueOptions: storeConfig.statusOrder,
        renderCell: (params: GridRenderCellParams) => {
          return (
            <Box sx={{ backgroundColor: colotState.get(params.value), color: 'white', width: '80%', textAlign: 'center' }}>
              <Typography>{params.value}</Typography>
            </Box>
          )
        }

      },
      {
        field: "date", headerName: "Date", flex: 50, align: 'center', headerAlign: 'center', type: 'date',
        valueFormatter: (params: GridValueFormatterParams) => {
          return params.value!.toString().substring(0, 10);
        }
      },
      {
        field: "price", headerName: "Price", flex: 30, align: 'center', headerAlign: 'center'
      },
      {
        field: "actions", type: 'actions', flex: 80, align: 'center', headerAlign: 'center',
        getActions: (params: GridRowParams) => {
          return [
            <GridActionsCellItem
              icon={<VisibilityIcon />}
              label="Show Details"
              onClick={() => showOrder(params.id)}
            />,
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit Order"
              onClick={() => editOrder(params.id)}
            />,
            <GridActionsCellItem
              icon={<Delete />}
              label="Delete"
              onClick={() => rmOrder(params.id)}
            />
          ]
        }
      }
    ];
  }

  //rows data gread
  const [rows, setRows] = useState<GridRowsProp>([]);

  useEffect(() => setRows(getRows(orders)), [orders]);

  function getRows(orders: Order[]): GridRowsProp {
    return orders.map(order => {
      if (clients.length > 0 && orders.length > 0) {
        const client = getClient(order.userId);
        const products = order.products.map(product => {
          return { product: getProduct(product.productId), count: product.count };
        });
        return {
          id: order.id,
          client: client!.name,
          phone: client!.phoneNumber,
          address: getClientAddressInfo(client!.deliveryAddress as DeliveryAddress),
          product: getProductInfo(products as { product: Product, options: Object, count: number }[]),
          status: order.status,
          date: order.dateCreate,
          price: order.totalPrice
        }
      } else {
        return {};
      }
    });
  }

  function getProductInfo(products: { product: Product, options: Object, count: number }[]): string {
    let res = '';

    products.forEach(product => {
      let options = '';
      _.keys(options).forEach(option => {
        options += option;
      });
      res += `product: ${product.product.title} options: ${options} count: ${product.count}. `
    })
    return res;
  }

 


  //call back actions
  function rmOrder(id: GridRowId) {
    console.log("remove order " + id);
    const order = getOrder(+id);
    console.log(order);

    if (!!order) {
      confirmationData.current.title = `remove order`;
      confirmationData.current.message = `Do you want remove order ID ${order?.id}`;
      confirmationData.current.handle = handleRemove.bind(undefined, +id);
      setdialogVisible(true);
    }
  }

  function showOrder(id: GridRowId) {
    console.log("show order " + id);
    //TODO  
  }

  function editOrder(id: GridRowId) {
    console.log("edit order " + id);
    //TODO
  }

  function handleRemove(id: number, status: boolean): void {
    if (status) {
      dispatch(orderStore.remove(id.toString()));
    }
    setdialogVisible(false);
  }

  //********************************************************* */


  //*****************************Utils **********************************/

  function getClientAddressInfo(deliveryAddress: DeliveryAddress): string {
    let res = `${deliveryAddress.street} ${deliveryAddress.house}`;
    return res;
  }

  function getProduct(id: number): Product | undefined {
    return products[products.findIndex(product => product.id === id)];
  }

  function getOrder(id: number): Order | undefined {
    return orders[orders.findIndex(order => order.id === id)];
  }

  function getClient(id: string): UserData | undefined {
    return clients[clients.findIndex(client => client.id === id)];
  }

  function getInfoOrder(order: Order): string[] {
    const res: string[] = [
      `Order ID  : ${order.id}`,
      `Client: ${getInfoClient(order.userId)}`,
      `Product: ${getInfoProduct(order.products)}`,
      `Total price: ${order.totalPrice}`,
      `Data create: ${order.dateCreate}`
    ];
    return res;
  }
  
  function getInfoClient(id: string){
    const client = getClient(id);

    return `Client: ${client?.name} Phone: ${client?.phoneNumber} Address: ${client?.deliveryAddress}`;
  }
  
  function getInfoProduct(products: any){

    return '';
  }

  //   function useGenerateOrder(): Order {

  //     function getOptionsProduct() {
  //         return { name: "extra", extraPay: 20 };
  //     }

  //     function getUserId() {
  //         const arrId = clients.map(e => e.id);
  //         return arrId[getRandomInteger(0, arrId.length)];
  //     }

  //     function getProductId() {
  //         const arrId = products.map(e => e.id);
  //         return arrId[getRandomInteger(0, arrId.length)];
  //     }

  //     function getOrderStatus() {
  //         const arr = [OrderStatus.COMPLIT, OrderStatus.WAITING, OrderStatus.COMPLIT];
  //         return arr[getRandomInteger(0, arr.length)];
  //     }

  //     return {
  //         userId: getUserId(),
  //         status: getOrderStatus(),
  //         products: [{ productId: getProductId(), options: getOptionsProduct(), count: getRandomInteger(1, 10) }],
  //         totalPrice: getRandomInteger(30, 200),
  //         dateCreate: new Date().toISOString()
  //     }
  // }

  // const btnClk = () => dispatch(orderStore.add(useGenerateOrder()));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Paper sx={{ width: { xs: '100vw', sm: '80vw' }, height: '80vh', marginTop: '2vh' }}>
        <DataGrid columns={columns} rows={rows}
        />
      </Paper>
      <DialogConfirm visible={dialogVisible} title={confirmationData.current.title} message={confirmationData.current.message} onClose={confirmationData.current.handle} />
      <ModalInfo title={"Detailed information about the orers"} message={textModal.current} visible={modalVisible} callBack={() => setModalVisible(false)} />

      {/* <Button onClick={()=>btnClk()} >add order</Button> */}
    </Box>

  )
}





export default OrdersList;