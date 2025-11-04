using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUserProductsNavigation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Conditionally drop foreign key if it exists
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT * FROM sys.foreign_keys 
                    WHERE object_id = OBJECT_ID(N'[dbo].[FK_Products_Users_UserId1]')
                    AND parent_object_id = OBJECT_ID(N'[dbo].[Products]')
                )
                BEGIN
                    ALTER TABLE [Products] DROP CONSTRAINT [FK_Products_Users_UserId1];
                END
            ");

            // Conditionally drop index if it exists
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT * FROM sys.indexes 
                    WHERE name = 'IX_Products_UserId1' 
                    AND object_id = OBJECT_ID('Products')
                )
                BEGIN
                    DROP INDEX [IX_Products_UserId1] ON [Products];
                END
            ");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("03dfefa0-023f-477b-84d3-35375806a58d"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("0dbbc1a0-d848-4a1e-a76d-8a0e5e7d2e02"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("69f5fef8-78c3-4988-8c5d-76fd882638f5"));

            // Conditionally drop column if it exists
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT * FROM sys.columns 
                    WHERE Name = N'UserId1' AND Object_ID = Object_ID(N'Products')
                )
                BEGIN
                    -- Drop any default constraints first
                    DECLARE @ConstraintName NVARCHAR(200);
                    SELECT @ConstraintName = Name 
                    FROM sys.default_constraints 
                    WHERE parent_object_id = Object_ID('Products') 
                    AND parent_column_id = (
                        SELECT column_id 
                        FROM sys.columns 
                        WHERE Name = N'UserId1' AND object_id = Object_ID(N'Products')
                    );
                    
                    IF @ConstraintName IS NOT NULL
                        EXEC('ALTER TABLE Products DROP CONSTRAINT ' + @ConstraintName);
                    
                    ALTER TABLE [Products] DROP COLUMN [UserId1];
                END
            ");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3570), new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3572) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3581), new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3581) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3585), new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3586) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("103d0d7d-cc1d-4fd1-a23d-5828d39015ab"), "Finance", new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3914), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3915), "0.15" },
                    { new Guid("44b65c34-7aaa-4b68-b4eb-934922a25e08"), "Security", new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3928), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3929), "5" },
                    { new Guid("9816eb35-c10e-4ea5-9143-a8e2aa618242"), "Finance", new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3919), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3919), "0.15" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("103d0d7d-cc1d-4fd1-a23d-5828d39015ab"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("44b65c34-7aaa-4b68-b4eb-934922a25e08"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("9816eb35-c10e-4ea5-9143-a8e2aa618242"));

            migrationBuilder.AddColumn<Guid>(
                name: "UserId1",
                table: "Products",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 27, 33, 70, DateTimeKind.Utc).AddTicks(9905), new DateTime(2025, 11, 3, 18, 27, 33, 70, DateTimeKind.Utc).AddTicks(9906) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 27, 33, 70, DateTimeKind.Utc).AddTicks(9910), new DateTime(2025, 11, 3, 18, 27, 33, 70, DateTimeKind.Utc).AddTicks(9910) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 27, 33, 70, DateTimeKind.Utc).AddTicks(9914), new DateTime(2025, 11, 3, 18, 27, 33, 70, DateTimeKind.Utc).AddTicks(9914) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("03dfefa0-023f-477b-84d3-35375806a58d"), "Finance", new DateTime(2025, 11, 3, 18, 27, 33, 71, DateTimeKind.Utc).AddTicks(230), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 11, 3, 18, 27, 33, 71, DateTimeKind.Utc).AddTicks(231), "0.15" },
                    { new Guid("0dbbc1a0-d848-4a1e-a76d-8a0e5e7d2e02"), "Security", new DateTime(2025, 11, 3, 18, 27, 33, 71, DateTimeKind.Utc).AddTicks(234), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 11, 3, 18, 27, 33, 71, DateTimeKind.Utc).AddTicks(234), "5" },
                    { new Guid("69f5fef8-78c3-4988-8c5d-76fd882638f5"), "Finance", new DateTime(2025, 11, 3, 18, 27, 33, 71, DateTimeKind.Utc).AddTicks(207), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 11, 3, 18, 27, 33, 71, DateTimeKind.Utc).AddTicks(208), "0.15" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Products_UserId1",
                table: "Products",
                column: "UserId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Users_UserId1",
                table: "Products",
                column: "UserId1",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
