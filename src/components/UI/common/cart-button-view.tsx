import { Badge, IconButton } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Link } from 'react-router-dom';
import { PATH_SHOPPING_CART } from '../../../config/routing';
import { useSelector } from 'react-redux';
import { ProductBatch } from '../../../models/product';
import { shoppingCartSelector } from '../../../redux/store';
import { getCartItemsCount } from '../../../utils/cart-utils';

const ShoppingCartButton = () => {

    const shoppingCart: ProductBatch[] = useSelector(shoppingCartSelector);

    return (
        <Badge badgeContent={getCartItemsCount(shoppingCart)} color="success">
            <Link to={PATH_SHOPPING_CART}>
                <IconButton sx={{":hover": {bgcolor: '#a23b0e'}, backgroundColor: '#ff6f04', color: '#fff', border: '2px solid white', width: 40, height: 40 }}>
                    <ShoppingCartIcon />
                </IconButton>
            </Link>
        </Badge>
    );
};

export default ShoppingCartButton;