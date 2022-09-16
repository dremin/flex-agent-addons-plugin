// Import redux methods
import { connect } from 'react-redux';

// Import the Redux Component
import CustomDirectories from './CustomDirectory';
import { namespace } from '../../states';

// Define mapping functions
const mapStateToProps = (state) => {
  return {
    directoryList: state[namespace].DirectoryReducer.directoryList,    
    response_status: state[namespace].DirectoryReducer.response_status,
    error: state[namespace].DirectoryReducer.error
  }
};

// Connect presentational component to Redux
export default connect(mapStateToProps)(CustomDirectories);