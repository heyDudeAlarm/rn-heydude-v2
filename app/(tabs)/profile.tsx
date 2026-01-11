import { ThemedText } from '@/components/common/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState('Thomas Kukabango');
  const [isEditing, setIsEditing] = useState(false);
  const [tempUserName, setTempUserName] = useState(userName);

  const handleProfileImagePress = () => {
    if (!isEditing) return;
    
    Alert.alert(
      'Profile Photo',
      'Choose your profile photo',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sample Image 1',
          onPress: () => {
            setProfileImage('https://picsum.photos/200/200?random=1');
          },
        },
        {
          text: 'Sample Image 2',
          onPress: () => {
            setProfileImage('https://picsum.photos/200/200?random=2');
          },
        },
        {
          text: 'Remove Photo',
          onPress: () => {
            setProfileImage(null);
          },
        },
      ]
    );
  };

  const handleEditPress = () => {
    if (isEditing) {
      // Save changes
      setUserName(tempUserName);
      Alert.alert('Success', 'Profile updated successfully!');
    } else {
      // Start editing
      setTempUserName(userName);
    }
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setTempUserName(userName);
    setIsEditing(false);
  };

  const menuItems = [
    {
      id: 1,
      title: 'My Account',
      icon: 'person.circle.fill',
      iconColor: '#8B5FBF',
    },
    {
      id: 2,
      title: 'Notifications',
      icon: 'bell.fill',
      iconColor: '#4A90E2',
    },
    {
      id: 3,
      title: 'Help Center',
      icon: 'questionmark.circle.fill',
      iconColor: '#8B5FBF',
    },
  ];

  const handleMenuPress = (itemId: number, title: string) => {
    console.log(`${title} pressed`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#f8f9fa' }]}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        {/* Edit Button */}
        <View style={styles.editButtonContainer}>
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: isEditing ? '#4CAF50' : '#8B5FBF' }]}
            onPress={handleEditPress}
          >
            <IconSymbol
              size={16}
              name={isEditing ? "checkmark" : "pencil"}
              color="#fff"
            />
          </TouchableOpacity>
          {isEditing && (
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: '#f44336', marginLeft: 8 }]}
              onPress={handleCancelEdit}
            >
              <IconSymbol
                size={16}
                name="xmark"
                color="#fff"
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={styles.profileImageContainer}
          onPress={handleProfileImagePress}
          disabled={!isEditing}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.defaultProfileImage]}>
              <IconSymbol
                size={80}
                name="person.fill"
                color="#999"
              />
            </View>
          )}
          {isEditing && (
            <View style={styles.cameraIconContainer}>
              <IconSymbol
                size={16}
                name="camera.fill"
                color="#fff"
              />
            </View>
          )}
        </TouchableOpacity>
        
        {isEditing ? (
          <TextInput
            style={[
              styles.userNameInput,
              { 
                color: colorScheme === 'dark' ? '#fff' : '#333',
                borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5'
              }
            ]}
            value={tempUserName}
            onChangeText={setTempUserName}
            placeholder="Enter your name"
            placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
            maxLength={30}
            textAlign="center"
          />
        ) : (
          <ThemedText style={styles.userName}>{userName}</ThemedText>
        )}
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              { 
                backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff',
                borderColor: colorScheme === 'dark' ? '#333' : '#f0f0f0'
              }
            ]}
            onPress={() => handleMenuPress(item.id, item.title)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}20` }]}>
                <IconSymbol
                  size={20}
                  name={item.icon}
                  color={item.iconColor}
                />
              </View>
              <ThemedText style={styles.menuItemText}>{item.title}</ThemedText>
            </View>
            <IconSymbol
              size={16}
              name="chevron.right"
              color={colorScheme === 'dark' ? '#666' : '#ccc'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 80,
    marginTop: 40,
    position: 'relative',
  },
  editButtonContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    zIndex: 1,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#8B5FBF',
  },
  defaultProfileImage: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#8B5FBF',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  userNameInput: {
    fontSize: 22,
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 200,
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
});