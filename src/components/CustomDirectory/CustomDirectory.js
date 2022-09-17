import * as React from "react";
import { templates, withTaskContext } from '@twilio/flex-ui';
import {Box} from '@twilio-paste/core/box';
import {Input} from '@twilio-paste/core/input';
import {
  TabContainer, ItemContainer
} from './CustomDirectoryComponents';
import DirectoryItem from './DirectoryItem';


  class CustomDirectories extends React.Component {

    constructor(props){        
      super(props);
      this.state = {searchTerm: ''};
    }
    
    filteredDirectory = () => {
        const { searchTerm } =  this.state;
        const { directoryList  } = this.props;
        return directoryList.filter(entry => {
        if (!searchTerm) {
            return true;
        }
        return entry.name.toLowerCase().includes(searchTerm.toLowerCase());
        })
    }

    onSearchInputChange = e => {
        this.setState({ searchTerm: e.target.value })
      }

    onTransferClick = item => payload => {
        console.log('Transfer clicked');
        console.log('Transfer item:', item);
        console.log('Transfer payload:', payload);
    }

    render() {

        return (
            <TabContainer key="custom-directory-container">
                <Box
                  paddingLeft="space50"
                  paddingRight="space50"
                  paddingTop="space60"
                  paddingBottom="space60">
                <Input
                    key="custom-directory-input-field"
                    onChange={this.onSearchInputChange}
                    placeholder={templates.WorkerDirectorySearchPlaceholder()}
                />
                
                </Box>
                <ItemContainer
                key="custom-directory-item-container"
                className="Twilio-WorkerDirectory-Workers"
                vertical
                >
                {console.warn('Directory entries:', this.filteredDirectory())}
                {this.filteredDirectory().map(item => {
                    return (
                    <DirectoryItem
                        item={item}
                        key={item.id}
                        onTransferClick={this.onTransferClick(item)}
                    />
                    );
                })}
                </ItemContainer>
            </TabContainer>
        );
    }

  }

export default withTaskContext(CustomDirectories);