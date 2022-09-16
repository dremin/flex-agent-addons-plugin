import {
    FlexBox,
    IconButton,
    FlexBoxColumn,
    styled
  } from '@twilio/flex-ui';


export const CallButton = styled(IconButton)`
  margin-right: 8px;
`;

export const ItemInnerContainer = styled(FlexBox)`
  display: flex;
  padding-left: 0px;
  padding-right: 12px;
  color: inherit;
  outline: none;
  background: none;
  ${(props) => props.theme.WorkerDirectory.Item}
  &:hover, &:focus-within {
    & .Twilio-WorkerDirectory-ButtonContainer {
      opacity: 1;
      display: flex;
    & * {
      max-width: inherit;
      max-height: inherit;
    }
   }  
  }
`;

export const ButtonContainer = styled("div")`
  display: none;
`;

export const ItemContainer = styled(FlexBox)`
  flex-grow: 1;
  overflow-y: auto;
  ${(props) => props.theme.WorkerDirectory.ItemsContainer}
`;

export const TabContainer = styled(FlexBoxColumn)`
  overflow-x: hidden;
`;
