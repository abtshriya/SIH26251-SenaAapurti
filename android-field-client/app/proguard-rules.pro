# Room Proguard rules
-keep class androidx.room.RoomDatabase { *; }
-keepclassmembers class * extends androidx.room.RoomDatabase { *; }
-dontwarn androidx.room.paging.**

# Keep Data Models
-keep class mil.gov.senaaapurti.fieldclient.data.** { *; }
