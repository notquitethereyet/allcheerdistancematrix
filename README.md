# AllCheer Distance Matrix Calculator

A React + TypeScript + Vite application for calculating distance matrices between addresses using different transport modes (DRIVE, TRANSIT, TELE).

## Features

- **Excel File Upload**: Supports .xlsx, .xls, and .csv files
- **Worksheet Selection**: Choose specific worksheets from multi-sheet Excel files
- **Transport Mode Detection**: Automatically detects TRANSIT rows requiring departure time
- **Real-time Processing**: Progress tracking for large distance matrix calculations
- **Result Download**: Download processed results as Excel files

## Transport Modes

- **DRIVE**: Standard driving directions
- **TRANSIT**: Public transportation (requires departure time)
- **TELE**: Telecommuting (no travel time)

## File Format Requirements

Your Excel file must include these columns:
- `Address Code`: Unique identifier for each location
- `Address`: Complete address with city, state, and zip code
- `Transport Mode`: One of DRIVE, TRANSIT, or TELE

## Technical Implementation

### Frontend Architecture
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **XLSX.js** for Excel file processing

### API Integration
- **Multipart Form Data**: Sends original Excel files to backend
- **Timestamp Handling**: Unix epoch seconds for TRANSIT calculations
- **Error Handling**: Comprehensive error states and user feedback

### File Processing Flow
1. User uploads Excel file
2. Frontend parses file and extracts worksheet data
3. User selects worksheet and departure time (if TRANSIT rows exist)
4. Frontend recreates Excel file with selected worksheet data
5. Sends recreated file + timestamp to backend API
6. Displays processing results and download link

**Note**: The frontend currently recreates Excel files from parsed data rather than sending the original file. This preserves data structure but may lose original formatting.

## Development

Built with:
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
