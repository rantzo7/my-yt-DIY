class UploadCookiesForm extends HTMLElement {
  constructor () {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: sans-serif;
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        label {
          font-weight: bold;
          margin-bottom: 5px;
        }
        input[type="file"] {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background-color: #fff;
        }
        button {
          padding: 10px 15px;
          border: none;
          border-radius: 5px;
          background-color: #007bff;
          color: white;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.3s ease;
        }
        button:hover:not(:disabled) {
          background-color: #0056b3;
        }
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        .success {
          background-color: #28a745; /* Green */
        }
        .error {
          background-color: #dc3545; /* Red */
        }
        .message {
          margin-top: 10px;
          font-size: 0.9em;
          color: #555;
        }
      </style>
      <form>
        <label for="cookies-file">Upload YouTube Cookies (cookies.txt)</label>
        <input type="file" id="cookies-file" accept=".txt" />
        <button type="submit" id="upload-button">Upload cookies.txt</button>
        <div class="message" id="status-message"></div>
      </form>
    `
    this.$fileInput = this.shadowRoot.getElementById('cookies-file')
    this.$uploadButton = this.shadowRoot.getElementById('upload-button')
    this.$statusMessage = this.shadowRoot.getElementById('status-message')

    this.shadowRoot.querySelector('form').addEventListener('submit', this.handleSubmit.bind(this))
    this.$fileInput.addEventListener('change', this.handleFileChange.bind(this))
  }

  handleFileChange () {
    // Reset button and message when a new file is selected
    this.$uploadButton.textContent = 'Upload cookies.txt'
    this.$uploadButton.classList.remove('success', 'error')
    this.$uploadButton.disabled = !this.$fileInput.files.length
    this.$statusMessage.textContent = ''
  }

  async handleSubmit (event) {
    event.preventDefault()

    const file = this.$fileInput.files[0]
    if (!file) {
      this.updateStatus('Please select a cookies.txt file.', 'error')
      return
    }

    this.$uploadButton.textContent = 'Uploading...'
    this.$uploadButton.disabled = true
    this.$uploadButton.classList.remove('success', 'error')
    this.$statusMessage.textContent = ''

    try {
      const fileContent = await this.readFileContent(file)
      const response = await fetch('/api/upload-cookies', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: fileContent
      })

      if (response.ok) {
        this.updateStatus('Cookies uploaded successfully! You are now logged in to YouTube.', 'success')
      } else {
        const errorText = await response.text()
        this.updateStatus(`Upload failed: ${errorText || response.statusText}`, 'error')
      }
    } catch (error) {
      console.error('Error uploading cookies:', error)
      this.updateStatus(`An error occurred: ${error.message}`, 'error')
    } finally {
      this.$uploadButton.disabled = false
    }
  }

  readFileContent (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => resolve(event.target.result)
      reader.onerror = (error) => reject(error)
      reader.readAsText(file)
    })
  }

  updateStatus (message, type) {
    this.$statusMessage.textContent = message
    this.$uploadButton.classList.remove('success', 'error')
    if (type === 'success') {
      this.$uploadButton.classList.add('success')
      this.$uploadButton.textContent = 'Upload Successful!'
    } else if (type === 'error') {
      this.$uploadButton.classList.add('error')
      this.$uploadButton.textContent = 'Upload Failed!'
    } else {
      this.$uploadButton.textContent = 'Upload cookies.txt'
    }
  }
}

customElements.define('upload-cookies-form', UploadCookiesForm)
