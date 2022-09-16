import * as React from "react";
import {
  Actions,
  IconButton,
  UserCard,
  templates,
  withTheme,
  withTaskContext,
  Manager
} from '@twilio/flex-ui';
import { ButtonContainer, CallButton, ItemInnerContainer } from '../CustomDirectoryComponents';
import { WorkerMarginPlaceholder } from './DirectoryItemComponents';

class DirectoryItem extends React.Component {

    constructor(props){        
        super(props);
    }

    onWarmTransferClick = (e) => {
        this.props.onTransferClick({ mode: "WARM" });
        
        let from;
        
        if (this.props.phoneNumber) {
            from = this.props.phoneNumber
          }
        else {
            from = Manager.getInstance().serviceConfiguration.outbound_call_flows.default.caller_id;
        }
        
        Actions.invokeAction("CustomExternalTransferTask", {
          task: this.props.task,
          mode: 'WARM',
          to: this.props.item.phone,
          from,
          sipTarget: this.props.item.sipTarget
        });
        
        Actions.invokeAction("HideDirectory");
    };

    onColdTransferClick = async (e) => {
        this.props.onTransferClick({ mode: "COLD" });
        
        Actions.invokeAction("CustomExternalTransferTask", {
          task: this.props.task,
          mode: 'COLD',
          to: this.props.item.phone,
          sipTarget: this.props.item.sipTarget
        });
        
        Actions.invokeAction("HideDirectory");
    };


    render(){
       
        const {enableWarmTransfer, phone, name} = this.props.item;
        
        return(
            <ItemInnerContainer className="Twilio-WorkerDirectory-Worker" noGrow noShrink>
            <WorkerMarginPlaceholder noGrow noShrink />
            <UserCard
            className="Twilio-WorkerDirectory-UserCard"
            firstLine={name}
            secondLine={phone}
            isAvailable
            imageUrl=""
            large
            />
            <ButtonContainer className="Twilio-WorkerDirectory-ButtonContainer"> 
            {enableWarmTransfer === 'true' && 
            <CallButton
            icon="Call"
            onClick={this.onWarmTransferClick}
            variant='secondary'
            size='small'
            title={templates.WarmTransferTooltip()}
            />
            }
            
            <IconButton
                icon="Transfer"
                onClick={this.onColdTransferClick}
                variant='secondary'
                size='small'
                title={templates.ColdTransferTooltip()}
            />
            </ButtonContainer>
            </ItemInnerContainer>
        )
    }


}


export default (withTheme(withTaskContext(DirectoryItem)));