import * as React from 'react';
import { connect } from 'react-redux';
import { withTheme, styled } from '@twilio/flex-ui';
import ConferenceService from '../../services/ConferenceService';

const Name = styled('div')`
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.25rem;
  margin-top: 0.75rem;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NameListItem = styled('div')`
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.25rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

class ParticipantName extends React.Component {
  state = {
    name: ''
  };
  
  formatName(name) {
    if (name.startsWith('sip:')) {
      try {
        name = name.match(/^(sips?):([^@]+)(?:@(.+))?$/)[2];
      } catch {
        // keep it as-is
      }
    }
    
    return name;
  }

  componentDidMount() {
    const { participant, task } = this.props;

    if (participant.participantType === 'customer') {
      let name = task.attributes.outbound_to || task.attributes.name || task.attributes.from;
      name = this.formatName(name);
      this.setState({ name });
      return;
    }
    // Flex UI 2.0 returns an undefined participantType instead of expected value "unknown"
    if (!participant.participantType || participant.participantType === 'unknown') {
      ConferenceService.getCallProperties(participant.callSid)
        .then(response => {
          if (response) {
            let name = (response && response.to) || 'Unknown';
            name = this.formatName(name);
            this.setState({ name });
          }
        })
        .catch(_error => {
          const name = 'Unknown';
          this.setState({ name });
        });
      
    } else {
      this.setState({ name: participant.worker ? participant.worker.fullName : 'Unknown' });
    }
  }

  render() {
    return this.props.listMode
      ? (
        <NameListItem className="ParticipantCanvas-Name">
          {this.state.name}
        </NameListItem>
      ) : (
        <Name className="ParticipantCanvas-Name">
          {this.state.name}
        </Name>
      );
  }
}

const mapStateToProps = state => {
  const { serviceBaseUrl } = state.flex.config;

  return {
    serviceBaseUrl,
  };
};

export default connect(mapStateToProps)(withTheme(ParticipantName));
