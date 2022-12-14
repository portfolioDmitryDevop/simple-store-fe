import { Logout } from "@mui/icons-material";
import { Avatar, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from "@mui/material";
import React from "react";
import { FC } from "react";
import { Link } from "react-router-dom";
import { PATH_INDEX, PATH_LOGOUT, PATH_SHOPPING_CART } from "../../../config/routing";
import { RouteType } from "../../../models/route-type";
import { UserData } from "../../../models/user-data";

const ProfileMenu: FC<{items: RouteType[], userData: UserData}> = (props) => {

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const firstLettter = props.userData.name ? props.userData.name!.charAt(0).toUpperCase() : 'A'
 
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = (event: any) => {
        setAnchorEl(null);
    };
   
    return  <React.Fragment>
                <Tooltip title="Account">
                    <IconButton
                        onClick={handleClick}
                        size="small"
                        aria-controls={open ? 'account-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined} >
                        <Avatar sx={{ width: 36, height: 36, border: '2px solid white', }}>
                            { props.userData.photoURL !== '' ? <img src={props.userData.photoURL} alt={firstLettter} width='36' height='36' /> : firstLettter }
                        </Avatar>
                    </IconButton>
                </Tooltip>
                <Menu
                    anchorEl={anchorEl}
                    id="account-menu"
                    open={open}
                    onClose={handleClose}
                    onClick={handleClose}
                    PaperProps={{
                        elevation: 0,
                        sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                            mt: 1.5,
                            '& .MuiAvatar-root': {
                            width: 48,
                            height: 48,
                            ml: -0.5,
                            mr: 1,
                            },
                            '&:before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                            },
                        },
                    }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                    { !props.userData.isAdmin && props.items.filter(item => item.path !== PATH_INDEX && item.path !== PATH_SHOPPING_CART).map(item => 
                            <MenuItem component={Link} to={item.path} key={item.path} sx={{minWidth: '200px'}}>
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                {item.label}
                            </MenuItem>) }

                    { !props.userData.isAdmin && <Divider />}
                    <MenuItem component={Link} to={PATH_LOGOUT} >
                        <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                        Logout
                    </MenuItem>
                </Menu>
            </React.Fragment>
};

export default ProfileMenu;