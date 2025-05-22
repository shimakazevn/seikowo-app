// Function to backup user data to Google Drive
export const backupUserData = async (accessToken, userId, data) => {
  try {
    // Validate input
    if (!accessToken || !userId || !data) {
      throw new Error('Missing required parameters');
    }

    // Create file metadata
    const metadata = {
      name: `history_${userId}.json`,
      mimeType: 'application/json',
    };

    // Convert data to JSON string
    const content = JSON.stringify(data);

    // Create multipart request body
    const boundary = 'foo_bar_baz';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const body = delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      content +
      close_delim;

    // First try to update existing file
    const existingFile = await findUserDataFile(accessToken, userId);
    const method = existingFile ? 'PATCH' : 'POST';
    const url = existingFile ?
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart` :
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: body
    });

    if (!response.ok) {
      throw new Error(`Failed to backup data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error backing up data:', error);
    throw error;
  }
};

// Function to restore user data from Google Drive
export const restoreUserData = async (accessToken, userId) => {
  try {
    // Find user's data file
    const file = await findUserDataFile(accessToken, userId);
    if (!file) {
      console.log('No backup file found');
      return null;
    }

    // Download file content
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to restore data: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error restoring data:', error);
    throw error;
  }
};

// Function to delete user data from Google Drive
export const deleteUserData = async (accessToken, userId) => {
  try {
    const file = await findUserDataFile(accessToken, userId);
    if (!file) {
      console.log('No file to delete');
      return;
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete data: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting data:', error);
    throw error;
  }
};

// Helper function to find user's data file
const findUserDataFile = async (accessToken, userId) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='history_${userId}.json'`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search for file: ${response.statusText}`);
    }

    const result = await response.json();
    return result.files[0];
  } catch (error) {
    console.error('Error finding user file:', error);
    throw error;
  }
}; 