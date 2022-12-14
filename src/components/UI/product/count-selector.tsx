import { Box, IconButton, Typography } from '@mui/material';
import React, { FC, useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import config from "../../../config/store-config.json";

enum SelectorType {INCREASE, DECREASE}

const CountSelector: FC<{handlerFunc: Function, value: number}> = (props) => {

    const [count, setCount] = useState<number>(props.value);
    useEffect( () => setCount(props.value),[props.value]);

    function handleChanges(_: any, type: SelectorType) {
        const newValue = type === SelectorType.INCREASE ? count + 1 : count - 1;
        if (newValue >= 1 && newValue <= config.maxItemsForOrder) { 
            setCount(newValue);
            props.handlerFunc(newValue);
        }
    }

    return (
        <React.Fragment>
            <Box sx={{display: 'flex', justifyContent: 'center'}}>
                <IconButton onClick={ _ => handleChanges(_, SelectorType.DECREASE)}><RemoveIcon /></IconButton>
                <Typography variant='h6' sx={{m: '0 5px 0 5px'}}>{count}</Typography>
                <IconButton onClick={ _ => handleChanges(_, SelectorType.INCREASE)}><AddIcon /></IconButton>
            </Box>
        </React.Fragment>
    );
};

export default CountSelector;