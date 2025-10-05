<template>
  <div class="container">
    <h2>User Profile</h2>

    <!-- Profile Information Display -->
    <div class="profile-info">
      <div v-if="userProfile.profileImage" class="profile-image">
        <img
          :src="userProfile.profileImage"
          alt="Profile Image"
          style="max-width: 200px; border-radius: 50%"
        />
      </div>
      <div v-else class="no-image">No profile image set</div>
      <div class="info">
        <p><strong>Username:</strong> {{ userProfile.username || 'Not set' }}</p>
        <p><strong>Email:</strong> {{ userProfile.email || 'Not set' }}</p>
      </div>
    </div>

    <!-- Change Profile Image -->
    <div class="section">
      <h3>Change Profile Image</h3>
      <input type="file" @change="handleFileChange" accept="image/*" />
      <button @click="fetchFileFromApi">Download Image from API</button>
      <button @click="saveProfileImage" :disabled="!fileData">Save Profile Image</button>
    </div>

    <!-- Change Settings -->
    <div class="section">
      <h3>Change Settings</h3>
      <div class="form-group">
        <label for="username">Username:</label>
        <input
          id="username"
          v-model="tempSettings.username"
          type="text"
          placeholder="Enter username"
        />
      </div>
      <div class="form-group">
        <label for="email">Email:</label>
        <input id="email" v-model="tempSettings.email" type="email" placeholder="Enter email" />
      </div>
      <button @click="saveSettings">Save Settings</button>
    </div>

    <!-- Messages -->
    <div v-if="message" class="message">{{ message }}</div>
  </div>
</template>

<script>
export default {
  name: 'UserProfile',
  data() {
    return {
      fileData: null,
      fileName: 'profile_image',
      fileType: '',
      message: '',
      userProfile: {
        username: '',
        email: '',
        profileImage: '',
      },
      tempSettings: {
        username: '',
        email: '',
      },
    }
  },
  mounted() {
    // Load user profile from localStorage when component is mounted
    this.loadUserProfile()
  },
  methods: {
    loadUserProfile() {
      const userProfileJson = localStorage.getItem('userProfile')
      if (userProfileJson) {
        try {
          this.userProfile = JSON.parse(userProfileJson)
          // Ensure profileImage is a data URL
          if (this.userProfile.profileImage && !this.userProfile.profileImage.startsWith('data:')) {
            this.userProfile.profileImage = `data:${this.userProfile.fileType || 'image/jpeg'};base64,${this.userProfile.profileImage}`
          }
          // Sync tempSettings with userProfile
          this.tempSettings = {
            username: this.userProfile.username || '',
            email: this.userProfile.email || '',
          }
          this.message = 'Profile loaded from localStorage'
        } catch (e) {
          this.message = `Error loading profile: ${e.message}`
        }
      } else {
        this.message = 'No user profile found in localStorage'
      }
    },
    handleFileChange(event) {
      this.fileData = event.target.files[0]
      this.fileName = this.fileData?.name || 'profile_image'
      this.fileType = this.fileData?.type || 'image/jpeg'
      this.message = this.fileData ? 'Image selected' : 'No image selected'
    },
    async fetchFileFromApi() {
      try {
        // Replace with your actual API endpoint
        const response = await fetch('YOUR_API_ENDPOINT', {
          method: 'GET',
          headers: {
            // Add any necessary headers (e.g., authorization)
          },
        })

        if (!response.ok) {
          throw new Error('Network response was not ok')
        }

        // Get the blob from response
        this.fileData = await response.blob()

        // Try to get filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition')
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="([^"]+)"/)
          if (match) this.fileName = match[1]
        }

        // Get file type from response or blob
        this.fileType = this.fileData.type || response.headers.get('Content-Type') || 'image/jpeg'

        this.message = 'Image downloaded successfully!'
      } catch (error) {
        this.message = `Error downloading image: ${error.message}`
      }
    },
    saveProfileImage() {
      if (!this.fileData) {
        this.message = 'No image to save'
        return
      }

      const reader = new FileReader()

      reader.onload = (event) => {
        // Get Base64 string (removing data URL prefix)
        const base64String = event.target.result.split(',')[1]

        try {
          // Update user profile with new image data
          this.userProfile.profileImage = `data:${this.fileType};base64,${base64String}`
          this.userProfile.fileType = this.fileType

          // Save user profile to localStorage
          localStorage.setItem('userProfile', JSON.stringify(this.userProfile))
          this.message = 'Profile image saved successfully!'
        } catch (e) {
          this.message = `Error saving profile image: ${e.message}`
        }
      }

      reader.onerror = () => {
        this.message = 'Error reading image'
      }

      reader.readAsDataURL(this.fileData)
    },
    saveSettings() {
      try {
        // Update user profile with new settings
        this.userProfile.username = this.tempSettings.username
        this.userProfile.email = this.tempSettings.email

        // Save user profile to localStorage
        localStorage.setItem('userProfile', JSON.stringify(this.userProfile))
        this.message = 'Settings saved successfully!'
      } catch (e) {
        this.message = `Error saving settings: ${e.message}`
      }
    },
  },
}
</script>

<style scoped>
.container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}
h2,
h3 {
  color: #333;
}
.profile-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}
.profile-image,
.no-image {
  width: 200px;
  height: 200px;
  margin-right: 20px;
}
.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 50%;
  color: #666;
}
.info {
  flex: 1;
}
.section {
  margin: 20px 0;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
}
.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.message {
  margin: 10px 0;
  padding: 10px;
  border-radius: 4px;
  background-color: #f0f0f0;
}
button {
  margin: 10px 5px;
  padding: 8px 16px;
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
input[type='file'] {
  margin: 10px 0;
}
</style>
