import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import {FC, useRef} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DeliveryAddress, UserData } from '../../../models/user-data';
import { setUserData, updateProfile } from '../../../redux/actions';
import { userDataSelector } from '../../../redux/store';
import AddressForm from '../common/address-form';

type AddressConfirmationProps = {
    visible: boolean,
    onClose: (status: boolean) => void,
}

const AddressConfirmation: FC<AddressConfirmationProps> = props => {

    const {visible, onClose} = props;
    const userData: UserData = useSelector(userDataSelector);
    const newUserData = useRef<UserData>(userData);
    const dispatch = useDispatch();

    function changeAddressHandler(address: DeliveryAddress): void {
        newUserData.current = {...userData, deliveryAddress: address};        
    }

    function confirmHandler() {
        dispatch(setUserData(newUserData.current));
        dispatch(updateProfile(newUserData.current));
        onClose(true);
    }

    return <Dialog
    open={visible}
    onClose={()=>onClose(false)}
    aria-labelledby="responsive-dialog-title"
>
    <DialogTitle id="responsive-dialog-title">
        Address Confirmation
    </DialogTitle>
    <DialogContent>
        <AddressForm userData={userData} callBack={changeAddressHandler} />
    </DialogContent>
    <DialogActions sx={{marginRight: '30px'}}>
        <Button color='warning' onClick={() => onClose(false)}>
            Back to Cart
        </Button>
        <Button color='warning' onClick={confirmHandler} autoFocus>
            Confirm
        </Button>
    </DialogActions>
</Dialog>
}

export default AddressConfirmation;