import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontSize: 10,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 15,
    borderBottom: '2 solid #1771B0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1771B0',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  username: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  date: {
    fontSize: 9,
    color: '#666666',
  },
  
  // Page 1 - Overview styles
  page1Container: {
    flexDirection: 'row',
    gap: 15,
    flex: 1,
  },
  page1Left: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  page1Right: {
    flex: 1,
    flexDirection: 'column',
    gap: 15,
  },
  section: {
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    border: '1 solid #E5E7EB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    borderBottom: '1 solid #D1D5DB',
    paddingBottom: 5,
  },
  visualizationImage: {
    width: '100%',
    height: 'auto',
    maxHeight: 500,
    objectFit: 'contain',
  },
  infoGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: '0.5 solid #E5E7EB',
  },
  infoLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 10,
    color: '#1F2937',
  },
  controlPanelTable: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5 solid #E5E7EB',
    paddingVertical: 5,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: '#374151',
  },
  tableCellBold: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  
  // Page 2 - 2D Visualizations styles
  chartsPageContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  chartsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chartBox: {
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    border: '1 solid #E5E7EB',
    width: '48.5%',
  },
  chartBox2: {
    width: '100%',
  },
  chartBox4: {
    width: '48.5%',
  },
  chartBox6: {
    width: '31%',
  },
  chartTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  chartImage: {
    width: '100%',
    height: 'auto',
    maxHeight: 140,
    objectFit: 'contain',
  },
  legendContainer: {
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    border: '1 solid #E5E7EB',
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 8,
    color: '#1F2937',
  },
  
  // Page 3 - Data Table styles
  dataTable: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1771B0',
    padding: 8,
    borderRadius: 4,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tableDataRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '0.5 solid #E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tableDataCell: {
    flex: 1,
    fontSize: 8,
    color: '#374151',
    textAlign: 'center',
  },
  tableDataRowAlt: {
    backgroundColor: '#F9FAFB',
  },
});

// Common header component
const PDFHeader = ({ username, date }) => (
  <View style={styles.header} fixed>
    <View style={styles.headerLeft}>
      <Text style={styles.headerTitle}>EPiC Structural</Text>
    </View>
    <View style={styles.headerRight}>
      <Text style={styles.username}>{username || 'User'}</Text>
      <Text style={styles.date}>{date}</Text>
    </View>
  </View>
);

// Page 1 - Overview
const Page1Overview = ({ visualizationImage, generalInfo, controlPanelData, username, date }) => (
  <Page size="A4" orientation="landscape" style={styles.page}>
    <PDFHeader username={username} date={date} />
    
    <View style={styles.page1Container} wrap={false}>
      {/* Left: 3D Visualization */}
      <View style={styles.page1Left}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3D Visualization</Text>
          {visualizationImage && (
            <Image src={visualizationImage} style={styles.visualizationImage} />
          )}
        </View>
      </View>
      
      {/* Right: General Information + Control Panel */}
      <View style={styles.page1Right}>
        {/* General Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Information</Text>
          <View style={styles.infoGrid}>
            {generalInfo.map((info, index) => (
              <View key={index} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{info.label}:</Text>
                <Text style={styles.infoValue}>{info.value}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Control Panel Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Control Panel Settings</Text>
          <View style={styles.controlPanelTable}>
            {controlPanelData.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCellBold}>{item.parameter}</Text>
                <Text style={styles.tableCell}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  </Page>
);

// Page 2 - 2D Visualizations
const Page2Charts = ({ chartImages, legendItems, username, date }) => {
  const chartCount = chartImages.length;
  let chartBoxStyle = styles.chartBox2;
  
  if (chartCount === 4) {
    chartBoxStyle = styles.chartBox4;
  } else if (chartCount === 6) {
    chartBoxStyle = styles.chartBox6;
  }
  
  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <PDFHeader username={username} date={date} />
      
      <Text style={styles.sectionTitle}>Performance Metrics - 2D Visualizations</Text>
      
      {/* Wrap the entire charts + legend section to prevent page breaks */}
      <View style={styles.chartsPageContainer} wrap={false}>
        <View style={styles.chartsContainer}>
          {chartImages.map((chart, index) => (
            <View key={index} style={[styles.chartBox, chartBoxStyle]}>
              <Text style={styles.chartTitle}>{chart.title}</Text>
              {chart.image && (
                <Image src={chart.image} style={styles.chartImage} />
              )}
            </View>
          ))}
        </View>

        {legendItems && legendItems.length > 0 && (
          <View style={styles.legendContainer}>
            {legendItems.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: item.color || '#1F2937' }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Page>
  );
};

// Page 3 - Data Table
const Page3Table = ({ tableData, username, date }) => (
  <Page size="A4" orientation="landscape" style={styles.page}>
    <PDFHeader username={username} date={date} />
    
    <Text style={styles.sectionTitle}>Material Performance Data</Text>
    
    <View style={styles.dataTable}>
      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderCell}>Material</Text>
        {tableData.headers && tableData.headers.map((header, index) => (
          <Text key={index} style={styles.tableHeaderCell}>{header}</Text>
        ))}
      </View>
      
      {/* Data rows */}
      {tableData.rows && tableData.rows.map((row, rowIndex) => (
        <View 
          key={rowIndex} 
          style={[
            styles.tableDataRow,
            rowIndex % 2 === 1 && styles.tableDataRowAlt
          ]}
        >
          <Text style={styles.tableDataCell}>{row.material}</Text>
          {row.values.map((value, colIndex) => (
            <Text key={colIndex} style={styles.tableDataCell}>{value}</Text>
          ))}
        </View>
      ))}
    </View>
  </Page>
);

// Main PDF Document component
const PDFDocument = ({ 
  visualizationImage, 
  generalInfo, 
  controlPanelData, 
  chartImages, 
  legendItems,
  tableData,
  username 
}) => {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <Document>
      <Page1Overview 
        visualizationImage={visualizationImage}
        generalInfo={generalInfo}
        controlPanelData={controlPanelData}
        username={username}
        date={date}
      />
      <Page3Table 
        tableData={tableData}
        username={username}
        date={date}
      />
      <Page2Charts 
        chartImages={chartImages}
        legendItems={legendItems}
        username={username}
        date={date}
      />
    </Document>
  );
};

export default PDFDocument;
